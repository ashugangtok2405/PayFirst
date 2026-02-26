'use client'

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, runTransaction } from 'firebase/firestore';
import { addDays, addMonths, addWeeks, addYears, isAfter, parseISO } from 'date-fns';
import type { RecurringTransaction, Transaction } from '@/lib/types';
import { useToast } from './use-toast';

export function useRecurringProcessor() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const recurringQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'recurringTransactions'),
      where('nextGenerationDate', '<=', new Date().toISOString())
    );
  }, [user?.uid, firestore]);

  const { data: allDueRecurring } = useCollection<RecurringTransaction>(recurringQuery);

  const dueTransactions = useMemo(() => {
    if (!allDueRecurring) return [];
    return allDueRecurring.filter(t => t.active && t.autoCreate);
  }, [allDueRecurring]);


  useEffect(() => {
    if (!dueTransactions || dueTransactions.length === 0 || isProcessing || !firestore || !user) {
      return;
    }

    const process = async () => {
      setIsProcessing(true);
      let transactionsCreatedCount = 0;
      const now = new Date();

      for (const recurring of dueTransactions) {
        try {
          await runTransaction(firestore, async (tx) => {
            const recurringRef = doc(firestore, 'users', user.uid, 'recurringTransactions', recurring.id);
            const freshRecurringDoc = await tx.get(recurringRef);
            
            if (!freshRecurringDoc.exists() || !freshRecurringDoc.data().active) return;
            
            const freshRecurring = freshRecurringDoc.data() as RecurringTransaction;

            let nextDate = parseISO(freshRecurring.nextGenerationDate);
            const endDate = freshRecurring.endDate ? parseISO(freshRecurring.endDate) : null;
            
            let lastGeneratedThisRun: Date | null = null;
            
            while (nextDate <= now) {
              if (endDate && isAfter(nextDate, endDate)) {
                tx.update(recurringRef, { active: false });
                break;
              }
              
              const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
              const newTransactionData: Omit<Transaction, 'id'> = {
                  userId: user.uid,
                  type: freshRecurring.type,
                  amount: freshRecurring.amount,
                  description: freshRecurring.description,
                  transactionDate: nextDate.toISOString(),
                  categoryId: freshRecurring.categoryId,
                  fromBankAccountId: freshRecurring.fromBankAccountId,
                  toBankAccountId: freshRecurring.toBankAccountId,
                  fromCreditCardId: freshRecurring.fromCreditCardId,
                  toCreditCardId: freshRecurring.toCreditCardId,
                  recurringTransactionId: freshRecurring.id,
              };
              tx.set(newTransactionRef, newTransactionData);
              transactionsCreatedCount++;

              const amount = freshRecurring.amount;
              const type = freshRecurring.type;

              if (type === 'income' && freshRecurring.toBankAccountId) {
                  const accRef = doc(firestore, 'users', user.uid, 'bankAccounts', freshRecurring.toBankAccountId);
                  const accDoc = await tx.get(accRef);
                  if (accDoc.exists()) {
                      const newBalance = accDoc.data().currentBalance + amount;
                      tx.update(accRef, { currentBalance: newBalance });
                  }
              } else if (type === 'expense') {
                  if (freshRecurring.fromBankAccountId) {
                      const accRef = doc(firestore, 'users', user.uid, 'bankAccounts', freshRecurring.fromBankAccountId);
                      const accDoc = await tx.get(accRef);
                      if (accDoc.exists()) {
                          const newBalance = accDoc.data().currentBalance - amount;
                          tx.update(accRef, { currentBalance: newBalance });
                      }
                  } else if (freshRecurring.fromCreditCardId) {
                      const cardRef = doc(firestore, 'users', user.uid, 'creditCards', freshRecurring.fromCreditCardId);
                      const cardDoc = await tx.get(cardRef);
                      if (cardDoc.exists()) {
                          const newBalance = cardDoc.data().currentBalance + amount;
                          tx.update(cardRef, { currentBalance: newBalance });
                      }
                  }
              } else if (type === 'transfer' && freshRecurring.fromBankAccountId && freshRecurring.toBankAccountId) {
                  const fromRef = doc(firestore, 'users', user.uid, 'bankAccounts', freshRecurring.fromBankAccountId);
                  const toRef = doc(firestore, 'users', user.uid, 'bankAccounts', freshRecurring.toBankAccountId);
                  const fromDoc = await tx.get(fromRef);
                  if(fromDoc.exists()){
                      tx.update(fromRef, { currentBalance: fromDoc.data().currentBalance - amount });
                  }
                  const toDoc = await tx.get(toRef);
                  if(toDoc.exists()){
                      tx.update(toRef, { currentBalance: toDoc.data().currentBalance + amount });
                  }
              } else if (type === 'credit_card_payment' && freshRecurring.fromBankAccountId && freshRecurring.toCreditCardId) {
                  const bankRef = doc(firestore, 'users', user.uid, 'bankAccounts', freshRecurring.fromBankAccountId);
                  const cardRef = doc(firestore, 'users', user.uid, 'creditCards', freshRecurring.toCreditCardId);
                  const bankDoc = await tx.get(bankRef);
                  if(bankDoc.exists()){
                    tx.update(bankRef, { currentBalance: bankDoc.data().currentBalance - amount });
                  }
                  const cardDoc = await tx.get(cardRef);
                  if(cardDoc.exists()){
                    tx.update(cardRef, { currentBalance: cardDoc.data().currentBalance - amount });
                  }
              }

              lastGeneratedThisRun = nextDate;
              switch (freshRecurring.frequency) {
                case 'daily': nextDate = addDays(nextDate, 1); break;
                case 'weekly': nextDate = addWeeks(nextDate, 1); break;
                case 'monthly': nextDate = addMonths(nextDate, 1); break;
                case 'yearly': nextDate = addYears(nextDate, 1); break;
              }
            }

            if (lastGeneratedThisRun) {
                const finalUpdate: Partial<RecurringTransaction> = {
                    nextGenerationDate: nextDate.toISOString(),
                    lastGeneratedDate: lastGeneratedThisRun.toISOString(),
                };
                if (endDate && isAfter(nextDate, endDate)) {
                    finalUpdate.active = false;
                }
                tx.update(recurringRef, finalUpdate);
            }
          });
        } catch (e) {
          console.error(`Failed to process recurring transaction ${recurring.id}:`, e);
        }
      }

      if (transactionsCreatedCount > 0) {
        toast({
            title: "Recurring Transactions Processed",
            description: `${transactionsCreatedCount} transaction(s) were automatically created.`
        })
      }
      setIsProcessing(false);
    };

    process();

  }, [dueTransactions, isProcessing, firestore, user, toast]);
}
