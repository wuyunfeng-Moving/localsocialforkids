import React from 'react';

interface EventOperationProps {
  sourceEvent: any; // Define proper type for sourceEvent
  targetEvent: any; // Define proper type for targetEvent
  closeModal: () => void;
}

const EventOperation: React.FC<EventOperationProps> = ({ sourceEvent, targetEvent, closeModal }) => {
  const isAlreadyJoined = targetEvent.kidIds?.includes(sourceEvent.kidId);

  const handleJoin = async () => {
    try {
      // Handle successful join
      closeModal();
    } catch (error) {
      console.error('Error joining activity:', error);
      // Handle error
    }
  };

  const handleWithdraw = async () => {
    try {
      // Handle successful withdrawal
      closeModal();
    } catch (error) {
      console.error('Error withdrawing from activity:', error);
      // Handle error
    }
  };

  return (
    <div>
      <h2>Source Event Information</h2>
      {/* Display sourceEvent information */}
      <pre>{JSON.stringify(sourceEvent, null, 2)}</pre>

      <h2>Target Event Information</h2>
      {/* Display targetEvent information */}
      <pre>{JSON.stringify(targetEvent, null, 2)}</pre>

      {isAlreadyJoined ? (
        <button onClick={handleWithdraw}>Withdraw</button>
      ) : (
        <button onClick={handleJoin}>Join</button>
      )}

      <button onClick={closeModal}>Close</button>
    </div>
  );
};

export default EventOperation;
