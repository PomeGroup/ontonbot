import React from 'react';
import { Button, Modal, Placeholder } from '@telegram-apps/telegram-ui';

function CancelEventCard() {
    // Function to handle event cancellation (perform delete operation here)
    const handleCancelEvent = () => {
        // Add logic to delete the event
        console.log("Event canceled");
    };

    return (
        <Modal
            header={<Modal.Header>Are you sure you want to cancel this event?</Modal.Header>}
            trigger={
                <Button size="l" mode="filled" stretched className="bg-red-500 text-white w-full">
                    Cancel Event
                </Button>
            }
        >
            <Placeholder
                header="Cancel and permanently delete this event."
                description="This operation cannot be undone. If there are any registered guests, we will notify them that the event has been canceled."
            />

            {/* Modal actions */}
            <div className="mt-6 flex justify-end space-x-4">
                <Button mode="outline">
                    No, keep it
                </Button>
                <Button mode="filled" className="bg-red-500 text-white mb-5" onClick={handleCancelEvent}>
                    Yes, cancel event
                </Button>
            </div>
        </Modal>
    );
}

export default CancelEventCard;
