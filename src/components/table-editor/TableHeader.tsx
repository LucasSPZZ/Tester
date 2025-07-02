import React from 'react';
import { Table, Database, Columns, Key, Link } from 'lucide-react';
import type { DatabaseTable } from '../../types/database';

interface TableHeaderProps {
  table: DatabaseTable;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ table }) => {
  const primaryKeys = table.columns.filter(col => col.isPrimaryKey).length;
  const foreignKeys = table.columns.filter(col => col.isForeignKey).length;

  return (
    <div className="bg-[#1a1a1a] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-[#3b82f6] rounded flex items-center justify-center flex-shrink-0">
            <Table className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-white truncate">
              {table.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-[#888888] mt-1">
              <div className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                <span>Schema: {table.schema}</span>
              </div>
              <span className="w-1 h-1 bg-[#666666] rounded-full"></span>
              <div className="flex items-center gap-1">
                <Columns className="w-4 h-4" />
                <span>{table.columns.length} colunas</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] rounded border border-[#3a3a3a]">
            <Key className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">{primaryKeys}</span>
            <span className="text-[#888888] text-sm">PK</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] rounded border border-[#3a3a3a]">
            <Link className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-medium">{foreignKeys}</span>
            <span className="text-[#888888] text-sm">FK</span>
          </div>
        </div>
      </div>
    </div>
  );
};