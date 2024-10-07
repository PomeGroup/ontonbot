import srcImg from "@/components/MyCompo/Utils/SrcImg";
import PersonIcon from "@mui/icons-material/Person";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Fab } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const ShowProfileImage = ({ user, width = 40, height = 40, className = "borRadius100", enableDialog = false }) => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            {user?.avatar?.image ? (
                <>
                    <img
                        src={srcImg(user.avatar.image)}
                        alt={user?.userName || 'User'}
                        width={width}
                        height={height}
                        className={className}
                        onClick={enableDialog ? handleClickOpen : null}
                        style={enableDialog ? { cursor: 'pointer'  , mr : 1 ,ml:2} : {}}
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
                                        src={srcImg(user.avatar.image)}
                                        alt={user?.userName || 'User'}
                                        style={{ width: 'auto', maxHeight: '400px' }}
                                    />
                                </Box>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            ) : (
                <PersonIcon style={{ width: 40, height: 40 }} />
            )}
        </>
    );
};

export default ShowProfileImage;
