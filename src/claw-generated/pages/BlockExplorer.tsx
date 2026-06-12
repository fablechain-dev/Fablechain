import React, { useState, useEffect } from 'react';
import { useClawChain } from '../useClawChain';
import { Block } from '../blockchain/block';

const BlockExplorer: React.FC = () => {
  const { getBlocks } = useClawChain();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [blocksPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Block>('height');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<keyof Block | null>(null);
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const fetchBlocks = async () => {
      const latestBlocks = await getBlocks();
      setBlocks(latestBlocks);
    };
    fetchBlocks();
  }, [getBlocks]);

  const indexOfLastBlock = currentPage * blocksPerPage;
  const indexOfFirstBlock = indexOfLastBlock - blocksPerPage;
  const currentBlocks = blocks
    .filter((block) => filterBy ? block[filterBy].toString().includes(filterValue) : true)
    .sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    })
    .slice(indexOfFirstBlock, indexOfLastBlock);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(blocks.length / blocksPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      <h1>Block Explorer</h1>
      <div>
        <label>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as keyof Block)}>
            <option value="height">Height</option>
            <option value="hash">Hash</option>
            <option value="transactions">Tx Count</option>
            <option value="timestamp">Timestamp</option>
          </select>
          <button onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
            {sortDirection === 'asc' ? '▲' : '▼'}
          </button>
        </label>
        <label>
          Filter by:
          <select value={filterBy || ''} onChange={(e) => setFilterBy(e.target.value as keyof Block || null)}>
            <option value="">None</option>
            <option value="height">Height</option>
            <option value="hash">Hash</option>
            <option value="transactions">Tx Count</option>
            <option value="timestamp">Timestamp</option>
          </select>
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Height</th>
            <th>Hash</th>
            <th>Tx Count</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {currentBlocks.map((block) => (
            <tr key={block.hash}>
              <td>{block.height}</td>
              <td>{block.hash}</td>
              <td>{block.transactions.length}</td>
              <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {pageNumbers.map((number) => (
          <button
            key={number}
            className={currentPage === number ? 'active' : ''}
            onClick={() => setCurrentPage(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockExplorer;