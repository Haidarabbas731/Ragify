/**
 * Collections Page - Collection Management Interface
 * Full-page view for managing document collections
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Collections } from "../components/documents/Collections";

export function CollectionsPage() {
  const navigate = useNavigate();
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    // Navigate to dashboard with collection filter
    if (collectionId) {
      navigate(`/dashboard?collection=${collectionId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="p-6">
      <Collections
        onSelectCollection={handleSelectCollection}
        selectedCollectionId={selectedCollectionId}
      />
    </div>
  );
}
