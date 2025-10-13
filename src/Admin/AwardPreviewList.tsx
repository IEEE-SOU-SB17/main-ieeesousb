import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  onSnapshot,
  where
} from "firebase/firestore";

interface AwardsPreviewListProps {
  onEdit: (award: any) => void;
  onDelete: (id: string) => void;
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

const AwardsPreviewList: React.FC<AwardsPreviewListProps> = ({
  onEdit,
  onDelete,
  setSuccess,
  setError
}) => {
  const navigate = useNavigate();
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [awardsPerPage] = useState<number>(8);

  // Use Firestore real-time updates
  useEffect(() => {
    setLoading(true);
    try {
      const awardsQuery = query(
        collection(db, "awards"),
        orderBy("createdAt", "desc")
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        awardsQuery,
        (querySnapshot) => {
          const awardsList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAwards(awardsList);
          setLoading(false);
          console.log("Fetched awards:", awardsList.length);
        },
        (err) => {
          setError(`Error fetching awards: ${err.message}`);
          console.error("Awards fetch error:", err);
          setLoading(false);
        }
      );
      
      // Clean up the listener when component unmounts
      return () => unsubscribe();
    } catch (err: any) {
      setError(`Error setting up awards listener: ${err.message}`);
      console.error("Awards listener error:", err);
      setLoading(false);
    }
  }, [setError]);

  const handleDelete = async (awardId: string) => {
    try {
      await deleteDoc(doc(db, "awards", awardId));
      setSuccess("Award deleted successfully!");
      setConfirmDelete(null);
      // No need to fetch again - onSnapshot listener will update automatically
    } catch (err: any) {
      setError(`Error deleting award: ${err.message}`);
    }
  };

  const handleEdit = (award: any) => {
    onEdit(award);
  };

  // Filter awards based on search query
  const filteredAwards = awards.filter((award) =>
    award.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    award.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    award.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastAward = currentPage * awardsPerPage;
  const indexOfFirstAward = indexOfLastAward - awardsPerPage;
  const currentAwards = filteredAwards.slice(indexOfFirstAward, indexOfLastAward);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
  
      {/* Search Bar */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search Awards"
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* No Awards Found */}
      {!loading && filteredAwards.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No awards found. Add a new award to get started.
        </div>
      )}

      {/* Award Cards */}
      {!loading && currentAwards.length > 0 && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentAwards.map((award) => (
            <div
              key={award.id}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                {award.image ? (
                  <img
                    src={award.image}
                    alt={award.title}
                    className="object-cover w-full h-64"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  {award.title || "Unnamed Award"}
                </h3>
                {award.year && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Year:</span> {award.year}
                  </p>
                )}
                {award.recipient && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Recipient:</span> {award.recipient}
                  </p>
                )}
                {award.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {award.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleEdit(award)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  {confirmDelete === award.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(award.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Confirm Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                        title="Cancel"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(award.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredAwards.length > awardsPerPage && (
        <div className="flex justify-center space-x-4 py-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage * awardsPerPage >= filteredAwards.length}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AwardsPreviewList;