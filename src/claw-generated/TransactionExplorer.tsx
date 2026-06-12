import React, { useState, useEffect } from 'react';
import { Transaction, TransactionReceipt } from './transaction';
import { formatTimestamp, formatAmount, formatGasUsed } from './utils';

const TransactionExplorer: React.FC = () => {
  const [transactions, setTransactions] = useState<(Transaction & { receipt: TransactionReceipt })[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'gasUsed'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTransactions();
  }, [page, filter, sortBy, sortDirection]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?page=${page}&filter=${filter}&sortBy=${sortBy}&sortDirection=${sortDirection}`);
      const { data, totalPages: pages } = await response.json();
      setTransactions(data);
      setTotalPages(pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (newSortBy: 'timestamp' | 'amount' | 'gasUsed') => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  return (
    <div>
      <h1>Transaction Explorer</h1>
      <div>
        <label htmlFor="filter">Filter:</label>
        <input type="text" id="filter" value={filter} onChange={handleFilterChange} />
      </div>
      <div>
        <label htmlFor="sort">Sort by:</label>
        <select id="sort" value={sortBy} onChange={(e) => handleSortChange(e.target.value as 'timestamp' | 'amount' | 'gasUsed')}>
          <option value="timestamp">Timestamp</option>
          <option value="amount">Amount</option>
          <option value="gasUsed">Gas Used</option>
        </select>
        <button onClick={() => handleSortChange(sortBy)}>{sortDirection === 'asc' ? '▲' : '▼'}</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Gas Used</th>
            <th>Logs</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.hash}>
              <td>{tx.hash}</td>
              <td>{tx.from}</td>
              <td>{tx.to}</td>
              <td>{formatAmount(tx.amount)}</td>
              <td>{tx.receipt.status}</td>
              <td>{formatTimestamp(tx.timestamp)}</td>
              <td>{formatGasUsed(tx.receipt.gasUsed)}</td>
              <td>{tx.receipt.logs.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button key={pageNumber} onClick={() => handlePageChange(pageNumber)} disabled={page === pageNumber}>
            {pageNumber}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransactionExplorer;