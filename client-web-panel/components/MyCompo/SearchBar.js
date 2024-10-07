import React from 'react';
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

const SearchBar = ({ searchTerm, handleSearchChange ,t ,button }) => (
    <Grid container alignItems="center" spacing={2}>


        <Grid item xs={12} md={4} lg={2}  alignItems="flex-end"   style={{ marginLeft: 'auto' }}>

            <TextField
                name="search"
                value={searchTerm}
                onChange={handleSearchChange}

                fullWidth
                size="small"
                label={t('act.search')}

                InputProps={{
                    style: { borderRadius: 8 },
                }}
            />
        </Grid>

            {button?button:null}

    </Grid>
);

export default SearchBar;
