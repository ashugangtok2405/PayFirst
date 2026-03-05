'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, deleteDoc, query, where, getDocs, limit } from 'firebase/firestore'
import type { Category } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function CategorySettings() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const categoriesQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'categories') : null,
    [firestore, user?.uid]
  )
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery)

  const { incomeCategories, expenseCategories } = useMemo(() => {
    if (!categories) return { incomeCategories: [], expenseCategories: [] }
    return {
      incomeCategories: categories.filter(c => c.type === 'income'),
      expenseCategories: categories.filter(c => c.type === 'expense'),
    }
  }, [categories])

  const handleDelete = async (category: Category) => {
    if (!user) return;

    // First, check if any transactions are using this category
    const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, where('categoryId', '==', category.id), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: `Cannot delete "${category.name}" as it is being used by one or more transactions.`,
      })
      return;
    }

    try {
      const docRef = doc(firestore, 'users', user.uid, 'categories', category.id)
      await deleteDoc(docRef);
      toast({
        title: 'Category Deleted',
        description: `Category "${category.name}" has been removed.`,
      })
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Could not delete category.',
      })
    }
  }

  const renderCategoryList = (title: string, list: Category[]) => (
    <div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-2">
          {list.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">{category.name}</span>
              {category.isDefault ? (
                <span className="text-xs text-muted-foreground italic">Default</span>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the category "{category.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(category)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} categories found.</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>View and delete your custom transaction categories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderCategoryList('Income Sources', incomeCategories)}
        {renderCategoryList('Expense Categories', expenseCategories)}
      </CardContent>
    </Card>
  )
}
