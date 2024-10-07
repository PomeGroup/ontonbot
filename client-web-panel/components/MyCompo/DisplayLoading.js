import {Box, CircularProgress} from "@mui/material";

const DisplayLoading = ({text}) => {
  return (
      <Box
          sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
          }}
      >
          <CircularProgress />{" "} {" "} {text && <span>{text}</span>}
      </Box>
  );
}
export default DisplayLoading;