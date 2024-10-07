import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  Card,
  TextField,
} from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import DisplayLoading from "@/components/MyCompo/DisplayLoading";
import { useGetGuestListQuery } from '@/redux/slices/eventsApiSlice';
import { useCheckInTicketMutation } from "@/redux/slices/ticketApiSlice";
import useTranslation from "next-translate/useTranslation";
import GuestTable from "./GuestTable"; // Import the new GuestTable component
import TicketCheckInDialog from './TicketCheckInDialog'; // Import the dialog
import SearchBar from "@/components/MyCompo/SearchBar";
import PrintTicket from "@/components/MyCompo/PrintTicket"; // Import the PrintTicket component

const GuestListComponent = () => {
  const { t } = useTranslation("common");
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { uuid } = router.query;

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState(null);
  const [prevCursorStack, setPrevCursorStack] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [nextCursor, setNextCursor] = useState(null);
  const [moreRecordsAvailable, setMoreRecordsAvailable] = useState(false);
  const [barcode, setBarcode] = useState("");
  const barcodeInputRef = useRef(null);
  const [openDialog, setOpenDialog] = useState(false); // Dialog open state
  const [ticketData, setTicketData] = useState(null); // Store ticket data for the dialog
  const printRef = useRef(); // Ref for the PrintTicket component

  // Fetch the guest list with the current cursor
  const { data, error, isLoading, refetch } = useGetGuestListQuery(
    {
      eventUuid: uuid,
      limit: rowsPerPage,
      cursor,
      search: searchTerm,
    },
    {
      skip: !uuid,
    }
  );

  const [checkInTicket] = useCheckInTicketMutation();

  useEffect(() => {
    if (data) {
      setMoreRecordsAvailable(data.moreRecordsAvailable);
      setNextCursor(data.nextCursor);

      if (cursor !== null && !prevCursorStack.includes(cursor)) {
        setPrevCursorStack((prev) => [...prev, cursor]);
      }
    }

    if (error) {
      enqueueSnackbar(t("common.error_loading_guest_list"), { variant: "error" });
    }
  }, [data, error, cursor, prevCursorStack, enqueueSnackbar, t]);

  useEffect(() => {
    // Focus the barcode input on component mount
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCursor(null);
    setPrevCursorStack([]);
  };

  const handleNextPage = () => {
    if (moreRecordsAvailable && nextCursor !== null) {
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursorStack.length > 1) {
      const newPrevCursorStack = [...prevCursorStack];
      newPrevCursorStack.pop();
      const previousCursor = newPrevCursorStack[newPrevCursorStack.length - 1];
      setPrevCursorStack(newPrevCursorStack);
      setCursor(previousCursor);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCursor(null);
    setPrevCursorStack([]);
  };

  const handleBarcodeChange = async (e) => {
    const value = e.target.value;
    setBarcode(value);

    if (value.length === 36) { // Check if the input is UUID length
      try {
        const result = await checkInTicket({ order_uuid: value }).unwrap();

        if (result.state === "CHECKED_IN") {
          enqueueSnackbar(t("common.check_in_successful"), { variant: "success" });
          setTicketData(result.result); // Set ticket data for the dialog
          setOpenDialog(true); // Open the dialog
          refetch(); // Refetch the table data after a successful check-in

          handlePrintTicket(); // Trigger the print functionality
        } else if (result.state === "USED") {
          enqueueSnackbar(t("common.already_checked_in"), { variant: "info" });
        } else {
          enqueueSnackbar(result.error?.message || t("common.check_in_failed"), { variant: "error" });
        }

        setBarcode(""); // Clear the input after submission
      } catch (err) {
        const errorMessage = err?.data?.error?.message || t("common.check_in_failed");
        enqueueSnackbar(errorMessage, { variant: "error" });
        setBarcode(""); // Clear the input in case of failure
      }
    }
  };

  const handlePrintTicket = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(printRef.current.outerHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      alert("Ticket printed successfully!");
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
    setTicketData(null);  // Clear the ticket data
  };

  if (isLoading) {
    return <DisplayLoading text={t("common.loading")} />;
  }

  if (error) {
    return <p>{t("common.error_occurred")}: {error.message}</p>;
  }

  const guests = data?.visitorsData || [];

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "10px",
          p: "25px 25px 10px",
          mb: "15px",
        }}
      >
        {/* Material-UI TextField for barcode input */}
        <TextField
          fullWidth
          value={barcode}
          onChange={handleBarcodeChange}
          placeholder={t("common.scan_barcode")}
          inputRef={barcodeInputRef}
          variant="outlined"
          label={t("common.barcode")}
          margin="normal"
        />

        <SearchBar handleSearchChange={handleSearchChange} searchTerm={searchTerm} t={t} />

        <GuestTable
          guests={guests}
          moreRecordsAvailable={moreRecordsAvailable}
          prevCursorStack={prevCursorStack}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
          rowsPerPage={rowsPerPage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          t={t}
        />
      </Card>

      {/* Ticket check-in dialog */}
      <TicketCheckInDialog
        open={openDialog}
        onClose={handleCloseDialog}
        ticketData={ticketData}
      />

      {/* Hidden PrintTicket component for printing */}
      <PrintTicket ref={printRef} ticketData={ticketData} />
    </>
  );
};

GuestListComponent.displayName = "GuestListComponent";

const GuestList = () => (
  <SnackbarProvider maxSnack={3}>
    <GuestListComponent />
  </SnackbarProvider>
);

GuestList.displayName = "GuestList";

export default GuestList;
