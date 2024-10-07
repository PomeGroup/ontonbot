import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Fab } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import srcImg from "@/components/MyCompo/Utils/SrcImg"; // Utility to format the image URL

const ShowReceiptImage = ({ receipt, width = 200, height = 200, enableDialog = false }) => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            {receipt?.image ? (
                <>
                    <img
                        src={srcImg(receipt.image)}
                        alt={receipt?.description || 'Receipt'}
                        width={width}
                        height={height}
                        className="receipt-image"
                        onClick={enableDialog ? handleClickOpen : null}
                        style={enableDialog ? { cursor: 'pointer' } : {}}
                    />
                    {enableDialog && (
                        <Dialog
                            open={open}
                            onClose={handleClose}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                style: {
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            <DialogTitle>
                                <IconButton
                                    aria-label="close"
                                    onClick={handleClose}
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        top: 8,
                                        color: (theme) => theme.palette.grey[500],
                                    }}
                                >
                                    <Fab color="warning" size="small" sx={{ position: 'absolute', right: 10, top: 0 }}>
                                        <CloseIcon sx={{ color: '#fff !important' }} />
                                    </Fab>
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <img
                                        src={srcImg(receipt.image)}
                                        alt={receipt?.description || 'Receipt'}
                                        style={{ width: 'auto', maxHeight: '400px' }}
                                    />
                                </Box>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: width,
                        height: height,
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                    }}
                >
                    No Image Available
                </Box>
            )}
        </>
    );
};

export default ShowReceiptImage;
