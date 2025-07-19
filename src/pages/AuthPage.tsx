import { LoginForm } from '@/components/auth/LoginForm';
import { Box, Container } from '@mui/material';

const AuthPage = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LoginForm />
      </Box>
    </Container>
  );
};

export default AuthPage; 