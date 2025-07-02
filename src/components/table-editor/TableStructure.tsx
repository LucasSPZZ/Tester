import React from 'react';
import { Table, Key, Link, Type } from 'lucide-react';
import type { DatabaseTable } from '../../types/database';

interface TableStructureProps {
  table: DatabaseTable;
}

export const TableStructure: React.FC<TableStructureProps> = ({ table }) => {
  return (
    <div className="h-full bg-[#1a1a1a] p-4">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0 bg-[#1a1a1a]">
          <Table className="w-4 h-4 text-[#3b82f6]" />
          <span className="text-[#cccccc] font-medium text-sm">Estrutura da Tabela</span>
          <div className="ml-auto text-xs text-[#888888]">
            {table.columns.length} colunas
          </div>
        </div>
        
        {/* Table Content */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] sticky top-0">
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider">
                  Coluna
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider">
                  Nullable
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider">
                  Padrão
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider">
                  Constraints
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {table.columns.map((column, index) => (
                <tr key={index} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm font-medium">
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
                      <Type className="w-4 h-4 text-[#22c55e]" />
                      <span className="text-[#22c55e] font-mono text-sm bg-[#22c55e]/10 px-2 py-1 rounded border border-[#22c55e]/20">
                        {column.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      column.nullable 
                        ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' 
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                    }`}>
                      {column.nullable ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {column.defaultValue ? (
                      <span className="text-[#cccccc] font-mono text-sm bg-[#2a2a2a] px-2 py-1 rounded">
                        {column.defaultValue}
                      </span>
                    ) : (
                      <span className="text-[#666666] text-sm italic">Nenhum</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {column.isPrimaryKey && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                          PK
                        </span>
                      )}
                      {column.isForeignKey && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-400/10 text-purple-400 border border-purple-400/20">
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
    </div>
  );
};