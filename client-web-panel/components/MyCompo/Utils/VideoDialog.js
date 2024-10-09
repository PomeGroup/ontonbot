import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
} from '@mui/material';
import ReactPlayer from 'react-player';
import useTranslation from 'next-translate/useTranslation';
import SrcVideo from "@/components/MyCompo/Utils/SrcVideo";

const VideoDialog = ({ open, onClose, videoUrl }) => {
    const { t } = useTranslation('common');

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: 'none',
                }
            }}
        >
            <DialogContent
                dividers
                sx={{
                    backgroundColor: 'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: 0,
                }}
            >
                <ReactPlayer url={SrcVideo(videoUrl)} controls width='100%' />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', backgroundColor: 'transparent' }}>
                <Button onClick={onClose} color="primary">
                    {t('act.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VideoDialog;
