import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db, User, Balance } from '@/lib/database';

interface ReportsProps {
  users: User[];
  balances: Balance[];
}

interface UserBalanceSummary {
  user: User;
  totalBalance: number;
  balanceCount: number;
  lastBalance: Balance | null;
}

export function Reports({ users, balances }: ReportsProps) {
  const [userSummaries, setUserSummaries] = useState<UserBalanceSummary[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const summaries: UserBalanceSummary[] = users.map(user => {
      const userBalances = balances.filter(b => b.userId === user.id);
      const totalBalance = userBalances.reduce((sum, b) => sum + b.amount, 0);
      const lastBalance = userBalances.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] || null;

      return {
        user,
        totalBalance,
        balanceCount: userBalances.length,
        lastBalance,
      };
    });

    setUserSummaries(summaries);
    setTotalBalance(balances.reduce((sum, b) => sum + b.amount, 0));
  }, [users, balances]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>User Balance Summary</CardTitle>
          <CardDescription>Overview of each user's balance information</CardDescription>
        </CardHeader>
        <CardContent>
          {userSummaries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Total Balance</TableHead>
                  <TableHead>Balance Count</TableHead>
                  <TableHead>Last Entry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSummaries.map(({ user, totalBalance, balanceCount, lastBalance }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.idNumber}</TableCell>
                    <TableCell>
                      <Badge variant={totalBalance > 0 ? 'default' : 'secondary'}>
                        {formatCurrency(totalBalance)}
                      </Badge>
                    </TableCell>
                    <TableCell>{balanceCount}</TableCell>
                    <TableCell>
                      {lastBalance ? (
                        <div className="text-sm">
                          <div>{lastBalance.month}</div>
                          <div className="text-muted-foreground">
                            {formatDate(lastBalance.createdAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No entries</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users registered yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Balance Entries</CardTitle>
          <CardDescription>Latest balance entries across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((balance) => {
                    const user = users.find(u => u.id === balance.userId);
                    return (
                      <TableRow key={balance.id}>
                        <TableCell className="font-medium">
                          {user?.name || 'Unknown User'}
                        </TableCell>
                        <TableCell>{balance.month}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatCurrency(balance.amount)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {balance.description || '-'}
                        </TableCell>
                        <TableCell>{formatDate(balance.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No balance entries yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}