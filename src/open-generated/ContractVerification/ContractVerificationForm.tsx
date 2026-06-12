import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { deployContract, verifyContract } from '../../services/contractService';

const ContractVerificationForm: React.FC = () => {
  const [sourceCode, setSourceCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await verifyContract(sourceCode);
      message.success('Contract verification successful!');
    } catch (error) {
      message.error(`Contract verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item
        label="Contract Source Code"
        name="sourceCode"
        rules={[{ required: true, message: 'Please enter the contract source code' }]}
      >
        <Input.TextArea
          rows={10}
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          placeholder="Enter the Solidity source code for your contract"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Verify Contract
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ContractVerificationForm;