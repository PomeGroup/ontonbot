import React from 'react';
import {
  Box, Typography
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { SidebarData ,SidebarDataDefault } from './SidebarData';
import SubMenu from './SubMenu';
import Link from 'next/link';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/router'
import useTranslation from "next-translate/useTranslation";
const SidebarNav = styled("nav")(({ theme }) => ({
  background: '#fff',
  boxShadow: "0px 4px 20px rgba(47, 143, 232, 0.07)",
  width: '300px',
  padding: '30px 10px',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  transition: '350ms',
  zIndex: '10',
  overflowY: 'auto'
}));
 
const SidebarWrap = styled("div")(({ theme }) => ({
  width: '100%'
}));

const Sidebar = ({ toogleActive }) => {
  const router = useRouter();

  // Access the current path
  const currentPath = router.pathname
  return (
    <>
      <div className='leftSidebarDark'>
        <SidebarNav className="LeftSidebarNav">
          <SidebarWrap>
            <Box 
              sx={{ 
                mb: '20px',
                px: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Link href='/'>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <img
                    src="/images/logo.png" alt="Logo"
                    className='black-logo'
                    style={{ cursor: 'pointer', maxHeight: '50px', textDecoration: 'none' }}
                  />

                  {/* For Dark Variation */}
                  <img
                    src="/images/logo.png" alt="Logo"
                    className='white-logo'
                    style={{ cursor: 'pointer', maxHeight: '50px', textDecoration: 'none' }}
                  />

                  {/* Typography for bold text next to logo */}
                  <Typography sx={{ ml: 2, fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                    OnTon
                  </Typography>
                </Box>
              </Link>


              <IconButton 
                onClick={toogleActive} 
                size="small"
                sx={{
                  background: 'rgb(253, 237, 237)',
                  display: { lg: 'none' }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>

            {SidebarData.map((item, index) => {
              return <SubMenu item={item} key={index} />;
            })}
            {
              (currentPath.startsWith('/admash')?SidebarDataDefault.map((item, index) => {
                return <SubMenu item={item} key={index} />;
              }
                ):null)

            }
          </SidebarWrap>
        </SidebarNav>
      </div>
    </>
  );
};

export default Sidebar;
