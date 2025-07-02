import React, { useState } from 'react';
import { Database, FunctionSquare as Function, Table, Settings } from 'lucide-react';
import type { DatabaseStructure, DatabaseTable, DatabaseFunction, SupabaseConnection } from '../types/database';
import { FunctionsDashboard } from './FunctionsDashboard';
import { TablesDashboard } from './TablesDashboard';

interface DashboardProps {
  structure: DatabaseStructure;
  connection: SupabaseConnection;
  onDisconnect: () => void;
  onSchemaUpdate?: () => void;
}

type ActiveTab = 'functions' | 'tables';

export const Dashboard: React.FC<DashboardProps> = ({ 
  structure, 
  connection, 
  onDisconnect,
  onSchemaUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('functions');

  const extractProjectName = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.split('.')[0];
    } catch {
      return 'Unknown Project';
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Navigation Bar - Bolt Style */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Project Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8b5cf6] rounded-md">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-medium text-white text-sm">
                {extractProjectName(connection.url)}
              </h1>
              <p className="text-xs text-[#888888]">
                Supabase Project
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-[#0a0a0a] rounded-md p-1 border border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab('functions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'functions'
                  ? 'bg-[#8b5cf6] text-white'
                  : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Function className="w-3 h-3" />
              Functions
              <span className="bg-[#2a2a2a] text-[#888888] text-xs px-1.5 py-0.5 rounded">
                {structure.functions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'tables'
                  ? 'bg-[#8b5cf6] text-white'
                  : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Table className="w-3 h-3" />
              Tables
              <span className="bg-[#2a2a2a] text-[#888888] text-xs px-1.5 py-0.5 rounded">
                {structure.tables.length}
              </span>
            </button>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={onDisconnect}
            className="p-2 text-[#888888] hover:text-white hover:bg-[#1a1a1a] rounded-md transition-colors"
            title="Disconnect"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'functions' ? (
          <FunctionsDashboard 
            functions={structure.functions}
            schema={structure}
            connection={connection}
            onSchemaUpdate={onSchemaUpdate}
          />
        ) : (
          <TablesDashboard 
            tables={structure.tables} 
            schema={structure}
            connection={connection}
            onSchemaUpdate={onSchemaUpdate}
          />
        )}
      </div>
    </div>
  );
};