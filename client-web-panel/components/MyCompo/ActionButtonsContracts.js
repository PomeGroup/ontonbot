import React from 'react';
import Link from 'next/link';
import { Fab, Typography, Box } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ClearIcon from '@mui/icons-material/Clear';

const ActionButtonsContracts = ({ pdfUrl, onDelete, isCancelled, invoiceDetails, InvoiceType, t }) => (
    <Box>

            <Link href={pdfUrl} passHref target="_blank">
                <Fab
                    color="primary"
                    aria-label="download"
                    size="small"
                    variant="extended"
                >
                    <CloudDownloadIcon />
                </Fab>
            </Link>
            {(!isCancelled && !InvoiceType) && (
                <Fab
                    color="error"
                    aria-label="delete"
                    size="small"
                    variant="extended"
                    onClick={onDelete}
                    sx={{ ml: 1 }}
                >
                    <ClearIcon sx={{ color: '#fff !important' }} />
                </Fab>
            )}
            {invoiceDetails?.invoiceLink && (
                <Link
                    href={invoiceDetails?.invoiceLink && `${process.env.NEXT_PUBLIC_BACKEND_URL.replace('/api/v1', '')}${invoiceDetails?.invoiceLink.replace(/\\/g, '/')}`}
                    passHref
                    target="_blank"
                >

                    <Fab
                        color="secondary"
                        aria-label="invoice-details"
                        size="small"
                        variant="extended"
                        sx={{ ml: 1 }}
                    >
                        {`${t('invoice.'+InvoiceType?.toLowerCase() )} - ${invoiceDetails.invoiceNumber}`}
                    </Fab>
                </Link>
            )}

        {(InvoiceType !== undefined && InvoiceType !== null && invoiceDetails )  && (

            <Link
                href={`${InvoiceType?.charAt(0).toLowerCase() + InvoiceType?.slice(1)}/?search=${invoiceDetails.invoiceNumber}`}
                passHref
                target="_blank"
            >
                <Fab
                    color="info"
                    aria-label="invoice-details"
                    size="small"
                    variant="extended"

                    sx={{ ml: 1,color: '#fff !important' }}
                >

                        {t('invoice.invoice_cancellation')}

                </Fab>

            </Link>
        )}
            </Box>
);

export default ActionButtonsContracts;
