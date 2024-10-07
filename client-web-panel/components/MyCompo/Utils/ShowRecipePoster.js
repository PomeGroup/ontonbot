import Image from 'next/image';
import srcImg from "@/components/MyCompo/Utils/SrcImg";
import PersonIcon from "@mui/icons-material/Person";
import React, { useState } from "react";
import {Dialog, DialogContent, DialogTitle, DialogActions, IconButton, Box, Fab} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {Delete as DeleteIcon, DockTwoTone} from "@mui/icons-material";
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
const ShowRecipePoster = ({ recipe, width = 40, height = 40, className = "borRadius100", enableDialog = false }) => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            {recipe?.poster ? (
                <>
                    <Image
                        src={srcImg(recipe.poster)}
                        alt={recipe?.title || 'User'}
                        width={width}
                        height={height}
                        className={className}
                        onClick={enableDialog ? handleClickOpen : null}
                        style={enableDialog ? { cursor: 'pointer' , mr : 1 ,ml:2 } : {}}
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

                                    <Fab color="warning" size="small"   sx={{ position: 'absolute', right: 10, top: 0 }}>
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
                                    <Image
                                        src={srcImg(recipe.poster)}
                                        alt={recipe?.title || 'User'}
                                        width={500}
                                        height={500}
                                        style={{ width: 'auto', maxHeight: '400px' }}
                                    />
                                </Box>
                            </DialogContent>

                        </Dialog>
                    )}
                </>
            ) : (
                <PhotoSizeSelectActualIcon style={{ width: 40, height: 40 ,color:'grey' }} />
            )}
        </>
    );
};

export default ShowRecipePoster;
