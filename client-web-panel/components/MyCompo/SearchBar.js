import React from 'react';
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

const SearchBar = ({ searchTerm, handleSearchChange ,t ,button }) => (
    <Grid container alignItems="center" spacing={2}>


        <Grid item xs={12} md={4} lg={4}  alignItems="flex-start"   style={{ marginRight: 'auto' }}>

            <TextField
                name="search"
                value={searchTerm}
                onChange={handleSearchChange}

                fullWidth
                size="small"
                label={t('act.search')}

            />
        </Grid>

            {button?button:null}

    </Grid>
);

export default SearchBar;
