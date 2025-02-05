import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  useSendOtpCodeMutation,
  useLoginWithOtpMutation,
} from "/redux/slices/authApiSlice"; // Adjust the path as necessary
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import styles from "@/components/Authentication/Authentication.module.css";
import useTranslation from "next-translate/useTranslation";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SignInForm = () => {
  const { t } = useTranslation("common");
  const router = useRouter();

  const [organizerId, setOrganizerId] = useState(""); // Organizer's Telegram handle
  const [userId, setUserId] = useState(""); // User's Telegram handle
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationField, setShowVerificationField] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [sendOtpCode] = useSendOtpCodeMutation();
  const [loginWithOtp] = useLoginWithOtpMutation();

  // Handles submitting the Organizer ID and User ID to request OTP
  const handleOtpRequestSubmit = async (event) => {
    event.preventDefault();
    try {
      // Send organizerId and userId to the backend to generate and send OTP
      const response = await sendOtpCode({ organizerId, userId }).unwrap();
      if (response.success) {
        setShowVerificationField(true); // Show verification field to enter OTP
        setSnackbarOpen(true); // Show success message
      }
    } catch (error) {
      setError(t("common.failed_to_send_verification_code")); // Handle error in sending OTP
    }
  };

  // Handles submitting the verification code to login
  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    try {
      // Send organizerId, userId, and OTP code for verification
      const response = await loginWithOtp({
        organizerId,
        userId,
        loginCode: verificationCode,
      }).unwrap();
      if (response.success) {
        router.push("/dashboard"); // Redirect to dashboard on successful login
      } else {
        setError(t("common.verification_failed")); // Handle login failure
      }
    } catch (error) {
      setError(t("common.verification_failed")); // Handle login error
    }
  };

  // Close snackbar when dismissed
  const handleCloseSnackbar = (_event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Allow user to edit the Organizer ID and User ID again
  const handleEditUserIds = () => {
    setShowVerificationField(false);
    setVerificationCode(""); // Reset verification code and allow editing
  };

  return (
    <div className="authenticationBox">
      <Box
        component="main"
        sx={{
          maxWidth: "510px",
          ml: "auto",
          mr: "auto",
          padding: "50px 0 100px",
        }}
      >
        <Grid item xs={12} md={12} lg={12} xl={12}>
          <Box>
            <Box
              className={styles.or}
              sx={{ width: "200px", mr: "auto", ml: "auto" }}
            >
              <NextLink href="/">
                <img src="/images/logo.png" alt="Logo" className="black-logo" />
                <img src="/images/logo.png" alt="Logo" className="white-logo" />
              </NextLink>
            </Box>

            {/* Conditionally show the correct form */}
            {!showVerificationField ? (
              // Form for Organizer and User ID submission to get OTP
              <Box
                component="form"
                noValidate
                onSubmit={handleOtpRequestSubmit}
              >
                <Box
                  sx={{
                    background: "#fff",
                    padding: "30px 20px",
                    borderRadius: "10px",
                    mb: "20px",
                  }}
                  className="bg-black"
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        {t("common.organizer_id")}
                      </Typography>
                      <TextField
                        required
                        fullWidth
                        id="organizerId"
                        name="organizerId"
                        autoComplete="organizerId"
                        InputProps={{ style: { borderRadius: 8 } }}
                        value={organizerId}
                        onChange={(e) => setOrganizerId(e.target.value)}
                        placeholder="@organizerUsername"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        {t("common.user_id")}
                      </Typography>
                      <TextField
                        required
                        fullWidth
                        id="userId"
                        name="userId"
                        autoComplete="userId"
                        InputProps={{ style: { borderRadius: 8 } }}
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="@userUsername"
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "16px",
                    padding: "12px 10px",
                    color: "#fff !important",
                  }}
                >
                  {t("common.get_code")}
                </Button>
              </Box>
            ) : (
              // OTP Verification Form
              <Box
                component="form"
                noValidate
                onSubmit={handleVerificationSubmit}
              >
                <Box
                  sx={{
                    background: "#fff",
                    padding: "30px 20px",
                    borderRadius: "10px",
                    mb: "20px",
                  }}
                  className="bg-black"
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        {t("common.verification_code")}
                      </Typography>
                      <TextField
                        required
                        fullWidth
                        id="verificationCode"
                        name="verificationCode"
                        autoComplete="verificationCode"
                        InputProps={{ style: { borderRadius: 8 } }}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        {t("common.code_sent_to")} {organizerId}.{" "}
                        <NextLink href="#" onClick={handleEditUserIds}>
                          {t("common.change_ids")}
                        </NextLink>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <FormHelperText error={!!error}>{error}</FormHelperText>
                    </Grid>
                  </Grid>
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "16px",
                    padding: "12px 10px",
                    color: "#fff !important",
                  }}
                >
                  {t("common.signIn")}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("common.verification_code_sent", { organizerId })}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SignInForm;
