import React from 'react';
import { Box, IconButton } from "@mui/material";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import PropTypes from "prop-types";

function PaginationActions({ moreRecordsAvailable, prevCursorStack, onNextPage, onPrevPage }) {
  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={onPrevPage}
        disabled={prevCursorStack.length <= 1} // Disable if no previous page available
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={onNextPage}
        disabled={!moreRecordsAvailable} // Disable if no more records are available
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
    </Box>
  );
}

PaginationActions.propTypes = {
  moreRecordsAvailable: PropTypes.bool.isRequired,
  prevCursorStack: PropTypes.array.isRequired,
  onNextPage: PropTypes.func.isRequired,
  onPrevPage: PropTypes.func.isRequired,
};

const Pagination = ({
                      moreRecordsAvailable,
                      prevCursorStack,
                      handleNextPage,
                      handlePrevPage,
                      rowsPerPage,
                      handleChangeRowsPerPage,
                      t,
                    }) => (
  <Box sx={{ width:'100%' ,  display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
    <PaginationActions
      moreRecordsAvailable={moreRecordsAvailable}
      prevCursorStack={prevCursorStack}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
    />
    <Box sx={{ ml: 2 }}>
      <select onChange={handleChangeRowsPerPage} value={rowsPerPage}>
        <option value={10}>{t("act.rows_per_page")}: 10</option>
        <option value={25}>{t("act.rows_per_page")}: 25</option>
        <option value={50}>{t("act.rows_per_page")}: 50</option>
      </select>
    </Box>
  </Box>
);

export default Pagination;
