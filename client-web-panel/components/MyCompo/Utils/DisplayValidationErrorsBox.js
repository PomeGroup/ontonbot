import { Box } from "@mui/material";
import React from "react";

const DisplayValidationErrorsBox = ({ validationErrors }) => {
    return (
        <>
            {validationErrors.length > 0 && (
                <Box
                    sx={{
                        backgroundColor: '#f4f07e',
                        padding: 1,
                        marginTop: 2,
                        borderRadius: 1,
                        textAlign: 'right',
                        width: '100%',
                        color: '#cc3838',
                    }}
                >
                    <ul  >
                        {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </Box>
            )}
        </>
    );
};

export default DisplayValidationErrorsBox;
