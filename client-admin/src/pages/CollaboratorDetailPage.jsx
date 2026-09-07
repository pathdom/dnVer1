import React from 'react';
import RelationshipDetailView from '../components/RelationshipDetailView';

export default function CollaboratorDetailPage({ collaborator, setCurrentPage }) {
  return (
    <RelationshipDetailView
      entity={collaborator}
      type="collaborator"
      backLabel="Quay lại danh sách cộng tác viên"
      onBack={() => setCurrentPage('collaborators')}
    />
  );
}
