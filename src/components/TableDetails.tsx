import React from 'react';
import { Table, Key, Link, Type } from 'lucide-react';
import type { DatabaseTable } from '../types/database';

interface TableDetailsProps {
  table: DatabaseTable;
}

export const TableDetails: React.FC<TableDetailsProps> = ({ table }) => {
  const primaryKeyColumns = table.columns.filter(col => col.isPrimaryKey);
  const foreignKeyColumns = table.columns.filter(col => col.isForeignKey);

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Table className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {table.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Schema: {table.schema}</span>
              <span>Columns: {table.columns.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-6 bg-gray-900">
        {/* Columns Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
            <h3 className="text-sm font-medium text-gray-300">Columns</h3>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr className="border-b border-gray-600">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nullable
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Constraints
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {table.columns.map((column, index) => (
                  <tr key={index} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm">
                          {column.name}
                        </span>
                        {column.isPrimaryKey && (
                          <Key className="w-4 h-4 text-yellow-400" title="Primary Key" />
                        )}
                        {column.isForeignKey && (
                          <Link className="w-4 h-4 text-purple-400" title="Foreign Key" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-mono text-sm">
                          {column.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        column.nullable 
                          ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30' 
                          : 'bg-red-900/20 text-red-400 border border-red-700/30'
                      }`}>
                        {column.nullable ? 'Nullable' : 'Not Null'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {column.defaultValue ? (
                        <span className="text-gray-300 font-mono text-sm">
                          {column.defaultValue}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {column.isPrimaryKey && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">
                            PK
                          </span>
                        )}
                        {column.isForeignKey && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-900/20 text-purple-400 border border-purple-700/30">
                            FK
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Relationships */}
        {foreignKeyColumns.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
              <h3 className="text-sm font-medium text-gray-300">Foreign Key Relationships</h3>
            </div>
            <div className="p-4 space-y-3">
              {foreignKeyColumns.map((column, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg border border-gray-600">
                  <Link className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-mono">{column.name}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-purple-400 font-mono">
                        {column.referencedTable}.{column.referencedColumn}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};