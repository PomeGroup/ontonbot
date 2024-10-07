import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import useTranslation from 'next-translate/useTranslation';

const TicketCheckInDialog = ({ open, onClose, ticketData }) => {
  const { t } = useTranslation('common');

  if (!ticketData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.ticket_details')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            {t('common.username')}: {ticketData.username || t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.first_name')}: {ticketData.first_name || t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.wallet_address')}: {ticketData.wallet_address || t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.ticket_status')}: {ticketData.ticket_status || t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.order_uuid')}: {ticketData.order_uuid || t('common.undefined')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketCheckInDialog;
