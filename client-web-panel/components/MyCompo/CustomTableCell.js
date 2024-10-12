import {TableCell} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import * as React from "react";

const CustomTableCell = ({ title, align, children, onClick, sortable }) => (
    <TableCell
        align={align}
        sx={{
            borderBottom: '1px solid #F7FAFF',
            padding: '8px 10px',
            fontSize: '13px',
            cursor: sortable ? 'pointer' : 'default',
        }}
        title={title}
        onClick={onClick}
    >
        {children}
        {sortable && <SortIcon sx={{ ml: 1, fontSize: '16px' }} />}
    </TableCell>
);

export default CustomTableCell;