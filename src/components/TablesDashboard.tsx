import React, { useState, useEffect } from 'react';
import { Table, Search, Database, Plus } from 'lucide-react';
import type { DatabaseTable, DatabaseStructure, SupabaseConnection } from '../types/database';
import { TableEditor } from './TableEditor';
import { CreateNewTable } from './CreateNewTable';

interface TablesDashboardProps {
  tables: DatabaseTable[];
  schema: DatabaseStructure;
  connection: SupabaseConnection;
  onSchemaUpdate?: () => void;
}

export const TablesDashboard: React.FC<TablesDashboardProps> = ({ 
  tables: initialTables, 
  schema, 
  connection,
  onSchemaUpdate 
}) => {
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Estado local das tabelas para permitir atualizações imediatas
  const [tables, setTables] = useState<DatabaseTable[]>(initialTables);

  // Sincronizar com as props quando elas mudarem
  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  // Filter tables based on search
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.schema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setSelectedTable(null);
    setIsCreatingNew(true);
  };

  const handleSelectTable = (table: DatabaseTable) => {
    setSelectedTable(table);
    setIsCreatingNew(false);
  };

  const handleBackToList = () => {
    setSelectedTable(null);
    setIsCreatingNew(false);
  };

  // Função chamada quando uma nova tabela é criada com sucesso
  const handleTableCreated = async (tableName: string, generatedSQL?: string) => {
    console.log(`Tabela criada: ${tableName}`);
    
    // Criar uma tabela temporária para exibição imediata
    const createdTable: DatabaseTable = {
      name: tableName,
      schema: 'public', // Assumir schema public por padrão
      columns: [], // Será preenchido quando o schema for recarregado
    };
    
    // Tentar extrair colunas do SQL gerado se disponível
    if (generatedSQL) {
      const extractedColumns = extractColumnsFromSQL(generatedSQL, tableName);
      createdTable.columns = extractedColumns;
    }
    
    // Atualizar a lista local de tabelas
    setTables(prevTables => {
      // Verificar se a tabela já existe na lista
      const existingTableIndex = prevTables.findIndex(table => table.name === tableName);
      
      if (existingTableIndex >= 0) {
        // Atualizar tabela existente
        const updatedTables = [...prevTables];
        updatedTables[existingTableIndex] = createdTable;
        return updatedTables;
      } else {
        // Adicionar nova tabela
        return [...prevTables, createdTable];
      }
    });
    
    // Selecionar a tabela e sair do modo de criação
    setSelectedTable(createdTable);
    setIsCreatingNew(false);
    
    // Notificar o componente pai para recarregar o schema
    if (onSchemaUpdate) {
      setTimeout(() => {
        onSchemaUpdate();
      }, 3000); // Recarregar após 3 segundos
    }
    
    console.log(`Redirecionado para a tabela: ${tableName}`);
  };

  // Função auxiliar para extrair colunas do SQL gerado
  const extractColumnsFromSQL = (sql: string, tableName: string) => {
    try {
      // Regex para capturar o conteúdo entre parênteses da CREATE TABLE
      const tableMatch = sql.match(new RegExp(`CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:[\\w.]+\\.)?${tableName}\\s*\\(([^;]+)\\)`, 'is'));
      if (!tableMatch || !tableMatch[1]) {
        return [];
      }

      const columnDefinitions = tableMatch[1];
      const columnLines = columnDefinitions.split(',').map(line => line.trim());
      
      const columns = [];
      
      for (const line of columnLines) {
        // Pular linhas que são constraints (PRIMARY KEY, FOREIGN KEY, etc)
        if (line.match(/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|CHECK|UNIQUE\s*\()/i)) {
          continue;
        }

        // Extrair nome e tipo da coluna
        const columnMatch = line.match(/^\s*(\w+)\s+([A-Z_][A-Z0-9_]*(?:\([^)]*\))?)/i);
        if (columnMatch) {
          const [, name, type] = columnMatch;
          
          const column = {
            name: name,
            type: type,
            nullable: !line.includes('NOT NULL'),
            isPrimaryKey: line.includes('PRIMARY KEY'),
            isForeignKey: line.includes('REFERENCES'),
            defaultValue: undefined as string | undefined
          };
          
          // Extrair valor padrão se existir
          const defaultMatch = line.match(/DEFAULT\s+([^,\s]+)/i);
          if (defaultMatch) {
            column.defaultValue = defaultMatch[1];
          }
          
          columns.push(column);
        }
      }
      
      return columns;
    } catch (err) {
      console.error('Erro ao extrair colunas do SQL:', err);
      return [];
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Tables Sidebar - Bolt Style */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col flex-shrink-0">
        {/* Search Header */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Buscar tabelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-sm"
            />
          </div>
          
          {/* Create New Button */}
          <button
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              isCreatingNew
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#cccccc] hover:text-white border border-[#3a3a3a] hover:border-[#4a4a4a]'
            }`}
          >
            <div className="p-1 bg-[#3b82f6] rounded">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-sm">Criar Nova Tabela</span>
          </button>
        </div>

        {/* Tables List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-3 px-2">
              Tabelas ({filteredTables.length})
            </h3>
            {filteredTables.map((table) => {
              const primaryKeys = table.columns.filter(col => col.isPrimaryKey).length;
              const foreignKeys = table.columns.filter(col => col.isForeignKey).length;
              
              return (
                <button
                  key={`${table.schema}.${table.name}`}
                  onClick={() => handleSelectTable(table)}
                  className={`w-full p-3 rounded transition-all text-left ${
                    selectedTable?.name === table.name
                      ? 'bg-[#3b82f6] text-white'
                      : 'text-[#cccccc] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-[#3b82f6] rounded flex-shrink-0">
                      <Table className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm mb-1">{table.name}</div>
                      <div className="text-xs opacity-75 mb-2 truncate">
                        {table.schema} • {table.columns.length} colunas
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {primaryKeys > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span>{primaryKeys} PK</span>
                          </div>
                        )}
                        {foreignKeys > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>{foreignKeys} FK</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">
              {tables.length}
            </div>
            <div className="text-xs text-[#888888]">Total Tables</div>
          </div>
        </div>
      </div>

      {/* Table Editor */}
      <div className="flex-1 min-w-0">
        {selectedTable ? (
          <TableEditor 
            table={selectedTable}
          />
        ) : isCreatingNew ? (
          <CreateNewTable 
            onBack={handleBackToList} 
            schema={schema}
            connection={connection}
            onTableCreated={handleTableCreated}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center">
              <div className="p-4 bg-[#3b82f6] rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#cccccc] mb-2">
                Selecione uma Tabela
              </h3>
              <p className="text-[#888888] max-w-md mb-4">
                Escolha uma tabela da lista ao lado para visualizar sua estrutura e fazer edições no banco de dados.
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Tabela
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};