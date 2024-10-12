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

const TicketCheckInDialog = ({ open, onClose, ticketData, guestInfo }) => {
  const { t } = useTranslation('common');

  if (!ticketData || !guestInfo) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.ticket_details')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          {/* Display user information */}
          <Typography variant="body1">
            {t('common.username')}: {guestInfo.username || t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.first_name')}: {guestInfo.first_name  ? guestInfo.first_name.toString() : t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.wallet_address')}: {guestInfo.wallet_address  ? guestInfo.wallet_address.toString() : t('common.undefined')}
          </Typography>

          {/* Display ticket information */}
          <Typography variant="body1">
            {t('common.ticket_status')}: {ticketData.ticket_status  ? ticketData.ticket_status.toString() : t('common.undefined')}
          </Typography>
          <Typography variant="body1">
            {t('common.order_uuid')}: {ticketData.order_uuid || t('common.undefined')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}  color="secondary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketCheckInDialog;
