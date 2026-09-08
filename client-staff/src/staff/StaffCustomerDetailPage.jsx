import React from 'react';
import RelationshipDetailView from '../components/RelationshipDetailView';

export default function StaffCustomerDetailPage({ customer, setCurrentPage }) {
  return (
    <RelationshipDetailView
      entity={customer}
      type="customer"
      backLabel="Quay lại danh sách khách hàng"
      onBack={() => setCurrentPage('customers')}
    />
  );
}
