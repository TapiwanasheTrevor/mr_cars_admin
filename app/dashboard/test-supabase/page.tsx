"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function TestSupabasePage() {
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Basic connection
      const { data: pingData, error: pingError } = await supabase
        .from('emergency_requests')
        .select('count', { count: 'exact', head: true });
      
      testResults.connection = pingError ? `Error: ${pingError.message}` : 'Success';
      testResults.tableExists = !pingError;

      // Test 2: Get all tables (if we have access)
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_tables', {});
      
      if (!tablesError && tablesData) {
        testResults.availableTables = tablesData;
      }

      // Test 3: Try to fetch emergency_requests
      const { data: emergencyData, error: emergencyError, count } = await supabase
        .from('emergency_requests')
        .select('*', { count: 'exact' })
        .limit(5);
      
      testResults.emergencyRequests = {
        error: emergencyError?.message,
        count: count,
        dataReceived: !!emergencyData,
        sampleData: emergencyData
      };

      // Test 4: Check auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      testResults.auth = {
        hasSession: !!session,
        error: authError?.message,
        user: session?.user?.email
      };

    } catch (error: any) {
      testResults.generalError = error.message;
    }

    setResults(testResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <Button onClick={runTests} disabled={isLoading} className="mb-4">
        {isLoading ? 'Running Tests...' : 'Run Tests Again'}
      </Button>

      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}