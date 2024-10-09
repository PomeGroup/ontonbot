import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Card, TextField } from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import DisplayLoading from "@/components/MyCompo/DisplayLoading";
import { useGetGuestListQuery } from '@/redux/slices/eventsApiSlice';
import { useCheckInTicketMutation } from "@/redux/slices/ticketApiSlice";
import useTranslation from "next-translate/useTranslation";
import GuestTable from "./GuestTable";
import SearchBar from "@/components/MyCompo/SearchBar";
import PrintTicket from "@/components/MyCompo/PrintTicket";
import { useRouter } from "next/router";
import {Box} from "@mui/system";
import Grid from "@mui/material/Grid";

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
  const [openDialog, setOpenDialog] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);

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
  // Focus the barcode input on page load
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    // Focus the barcode input on page load
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

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

    if (value.length === 36) {
      try {
        const result = await checkInTicket({ order_uuid: value }).unwrap();

        if (result.state === "CHECKED_IN") {
          enqueueSnackbar(t("common.check_in_successful"), { variant: "success" });
          setTicketData(result.result);
          setTicketInfo(result.ticketInfo);
          setGuestInfo(result.userInfo);
          setOpenDialog(true);
          refetch();
        }
        else if (result.state === "USED") {
          // Show confirmation dialog before reprinting
          const confirmReprint = window.confirm(t("common.ticket_already_used") + " \n " + t("common.want_to_print_again"));
          if (confirmReprint) {
            setTicketData(result.result);
            setTicketInfo(result.ticketInfo);
            setGuestInfo(result.userInfo);
            handlePrint(); // Proceed to print if confirmed
          }
          setBarcode("");  // Reset the barcode field
        } else {
          enqueueSnackbar(result.error?.message || t("common.check_in_failed"), { variant: "error" });
          setBarcode("");  // Reset the barcode field on failure
        }
      } catch (err) {
        console.error(err);
        enqueueSnackbar(t("common.check_in_error"), { variant: "error" });
      }
    }
  };

  // Automatically trigger print when ticketData and guestInfo are available
  useEffect(() => {
    if (ticketData && guestInfo) {
      handlePrint();
    }
  }, [ticketData, guestInfo]);

  const handlePrint = () => {
    if (!guestInfo || !ticketData || !ticketInfo) {
     // alert("No data to print");
      return;
    }

    // Open the print window and print the ticket
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Ticket</title></head><body>');
    printWindow.document.write(`
      <div>
        <h4>Event Ticket</h4>
        <p>Username: ${guestInfo.username}</p>
        <p>First Name: ${guestInfo.first_name}</p>
  
        
        <p>Order UUID: ${ticketInfo.order_uuid}</p>
        <p>Thank you for attending!</p>
      </div>
    `);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    // Clear the barcode field and refocus after print
    setBarcode("");
    barcodeInputRef.current.focus();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTicketData(null);
    setTicketInfo(null);
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} lg={4}>
            <TextField
              fullWidth
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder={t("common.scan_barcode")}
              inputRef={barcodeInputRef} // Ref for focusing the input
              variant="outlined"
              label={t("common.barcode")}
              sx={{ mb: "20px" , fontWeight: "500" }}
              margin="normal"
              size="small"
            />
          </Grid>
        </Grid>


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
