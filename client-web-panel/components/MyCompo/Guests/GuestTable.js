import * as React from "react";
import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Paper, Box, Typography } from "@mui/material";
import Link from "next/link";
import Pagination from "@/components/MyCompo/Pagination";
import FormatDate from "@/components/MyCompo/Utils/FormatDate";

// Custom Table Cell Component
const CustomTableCell = ({ title, align, children }) => (
  <TableCell
    align={align}
    sx={{
      borderBottom: "1px solid #F7FAFF",
      padding: "8px 10px",
      fontSize: "13px",
    }}
    title={title}
  >
    {children}
  </TableCell>
);

// Guest Table Component
const GuestTable = ({ guests, moreRecordsAvailable, prevCursorStack, handleNextPage, handlePrevPage, rowsPerPage, handleChangeRowsPerPage, t }) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
      <Table sx={{ minWidth: 950 }} aria-label="guest list table" className="dark-table">
        <TableHead sx={{ background: "#F7FAFF" }}>
          <TableRow>
            <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
              {t("common.username")}
            </TableCell>
            <TableCell align="center" sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
              {t("common.first_name")}
            </TableCell>
            <TableCell align="center" sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
              {t("common.wallet_address")}
            </TableCell>
            <TableCell align="center" sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
              {t("common.ticket_status")}
            </TableCell>
            <TableCell align="center" sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
              {t("act.registered_at")}
            </TableCell>
            <TableCell>
              {t("common.order_uuid")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guests.map((guest) => (
            <TableRow key={guest.user_id} sx={{ backgroundColor: `${guest.ticket_status === "USED" ? '#EEEEEE' : 'white'}` }}>
              <CustomTableCell title={guest.username}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box>
                    <Typography sx={{ fontWeight: "500", fontSize: "13.5px" }}>
                      {guest.username || t("common.undefined")}
                    </Typography>
                  </Box>
                </Box>
              </CustomTableCell>
              <CustomTableCell align="center">
                {guest.first_name || t("common.undefined")}
              </CustomTableCell>
              <CustomTableCell align="center">
                {guest.wallet_address ? (
                  <Link target={"_blank"} href={`https://tonviewer.com/${guest.wallet_address}?section=nfts`}>view wallet</Link>
                ) : (
                  t("common.undefined")
                )}
              </CustomTableCell>
              <CustomTableCell align="center">
                {guest.ticket_status || t("common.undefined")}
              </CustomTableCell>
              <CustomTableCell align="center">
                <FormatDate date={guest.created_at} t={t} />
              </CustomTableCell>
              <CustomTableCell align="center">
                {guest.ticket_order_id || t("common.undefined")}
              </CustomTableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <Pagination
              moreRecordsAvailable={moreRecordsAvailable}
              prevCursorStack={prevCursorStack}
              handleNextPage={handleNextPage}
              handlePrevPage={handlePrevPage}
              rowsPerPage={rowsPerPage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              t={t}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default GuestTable;
