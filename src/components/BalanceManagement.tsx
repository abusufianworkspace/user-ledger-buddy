import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db, User, Balance } from '@/lib/database';

interface BalanceManagementProps {
  users: User[];
  onBalanceAdded: (balance: Balance) => void;
}

export function BalanceManagement({ users, onBalanceAdded }: BalanceManagementProps) {
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    month: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, month: currentMonth }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.amount || !formData.month) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newBalance = await db.addBalance({
        userId: formData.userId,
        amount,
        month: formData.month,
        description: formData.description,
      });
      onBalanceAdded(newBalance);
      setFormData(prev => ({ ...prev, amount: '', description: '' }));
      toast({
        title: 'Success',
        description: 'Balance added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add balance. User might already have a balance for this month.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Management</CardTitle>
        <CardDescription>Add monthly balance for users</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={formData.userId} onValueChange={(value) => handleChange('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.idNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) => handleChange('month', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="Enter amount"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter description"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading || users.length === 0} className="w-full">
            {isLoading ? 'Adding...' : 'Add Balance'}
          </Button>
          {users.length === 0 && (
            <p className="text-muted-foreground text-sm text-center">
              Please register at least one user before adding balances
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}