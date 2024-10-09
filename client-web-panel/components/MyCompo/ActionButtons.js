import Link from "next/link";
import {Fab} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ClearIcon from "@mui/icons-material/Clear";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import React from "react";

const ActionButtons = ({ pdfUrl, onAction, isCancelled ,cancelReason,t }) => {


    return (

    <>
        <Link href={pdfUrl} passHref target={"_blank"}>
            <Fab
                color="primary"
                aria-label="download"
                size="small"
                variant="extended"
            >
                <CloudDownloadIcon sx={{mr:1}} />{t('invoice.invoice')}
            </Fab>
        </Link>{' '}

        <>
            <Link href={pdfUrl.replace('.pdf', '-negative.pdf')} passHref target={"_blank"}>
                <Fab
                    color="success"
                    size="small"
                    aria-label={isCancelled ? 'negative_invoice' : 'download'}
                    variant="extended"
                    sx={{ color: '#fff !important' }}
                    disabled={!isCancelled || cancelReason === 'canceled'}
                >
                    <CloudDownloadIcon sx={{mr:1}} />{t('invoice.negative_invoice')}
                </Fab>
            </Link>
        </>


        <>
            <Fab
                color="danger"
                aria-label="canceled"
                size="small"
                variant="extended"
                onClick={() => onAction('canceled')}
                disabled={isCancelled}
            >
                <ClearIcon sx={{ color: '#fff !important',mr:1 }} />{t('invoice.cancel')}
            </Fab>
            <Fab
                color="secondary"
                aria-label="refunded"
                size="small"
                variant="extended"
                onClick={() => onAction('refunded')}
                disabled={isCancelled}
            >
                <MonetizationOnIcon sx={{ color: '#fff !important',mr:1 }} />{t('invoice.refund')}
            </Fab>
        </>

    </>
)};
export default ActionButtons;