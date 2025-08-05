import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRegistration } from '@/components/UserRegistration';
import { BalanceManagement } from '@/components/BalanceManagement';
import { Reports } from '@/components/Reports';
import { DataManagement } from '@/components/DataManagement';
import { db, User, Balance } from '@/lib/database';
import { Users, DollarSign, BarChart3, Database } from 'lucide-react';

const Index = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [usersData, balancesData] = await Promise.all([
        db.getAllUsers(),
        db.getAllBalances(),
      ]);
      setUsers(usersData);
      setBalances(balancesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserAdded = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleBalanceAdded = (balance: Balance) => {
    setBalances(prev => [...prev, balance]);
  };

  const handleDataImported = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Balance Management System</h1>
          <p className="text-muted-foreground">
            Manage user registrations and track monthly balances with local data storage
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserRegistration onUserAdded={handleUserAdded} />
          </TabsContent>

          <TabsContent value="balances">
            <BalanceManagement users={users} onBalanceAdded={handleBalanceAdded} />
          </TabsContent>

          <TabsContent value="reports">
            <Reports users={users} balances={balances} />
          </TabsContent>

          <TabsContent value="data">
            <DataManagement onDataImported={handleDataImported} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
