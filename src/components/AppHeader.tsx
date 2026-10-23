"use client";

import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AssessmentOutlined,
  Brightness4Outlined,
  Brightness7Outlined,
  HomeOutlined,
  MenuBookOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";

export function AppHeader() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const view = useSimulatorStore((state) => state.view);
  const setView = useSimulatorStore((state) => state.setView);
  const settings = useSimulatorStore((state) => state.settings);
  const updateSettings = useSimulatorStore((state) => state.updateSettings);

  const navItems = [
    { view: "home" as const, label: "Inicio", icon: <HomeOutlined /> },
    { view: "bank" as const, label: "Banco", icon: <MenuBookOutlined /> },
    {
      view: "dashboard" as const,
      label: "Rendimiento",
      icon: <AssessmentOutlined />,
    },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{ borderBottom: 1, borderColor: "divider", zIndex: 1201 }}
      >
        <Toolbar sx={{ minHeight: { xs: 62, md: 68 }, gap: 1.5 }}>
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 32,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px",
            }}
          >
            {["#F25022", "#7FBA00", "#00A4EF", "#FFB900"].map((color) => (
              <Box key={color} sx={{ bgcolor: color }} />
            ))}
          </Box>
          <Box sx={{ minWidth: 0, mr: { md: 2 } }}>
            <Typography variant="subtitle1" fontWeight={750} noWrap>
              CertLab Microsoft
            </Typography>
            {!compact && (
              <Typography variant="caption" color="text.secondary">
                Simulador de práctica independiente
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.view}
                color={view === item.view ? "primary" : "inherit"}
                variant={view === item.view ? "contained" : "text"}
                startIcon={!compact ? item.icon : undefined}
                onClick={() => setView(item.view)}
                aria-label={item.label}
                sx={{ minWidth: compact ? 42 : undefined, px: compact ? 1 : 2 }}
              >
                {compact ? item.icon : item.label}
              </Button>
            ))}
          </Stack>

          <Tooltip title={settings.themeMode === "light" ? "Modo oscuro" : "Modo claro"}>
            <IconButton
              onClick={() =>
                updateSettings({
                  themeMode: settings.themeMode === "light" ? "dark" : "light",
                })
              }
              aria-label="Cambiar tema"
            >
              {settings.themeMode === "light" ? (
                <Brightness4Outlined />
              ) : (
                <Brightness7Outlined />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Configuración">
            <IconButton
              onClick={() => setSettingsOpen(true)}
              aria-label="Abrir configuración"
            >
              <SettingsOutlined />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Configuración del simulador</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box>
              <Typography fontWeight={700}>Experiencia de examen</Typography>
              <Typography variant="body2" color="text.secondary">
                Estas preferencias se aplican al siguiente intento.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pearsonMode}
                  onChange={(_, checked) =>
                    updateSettings({ pearsonMode: checked })
                  }
                />
              }
              label="Modo Pearson VUE (sin respuestas ni explicaciones durante el examen)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.shuffleOptions}
                  onChange={(_, checked) =>
                    updateSettings({ shuffleOptions: checked })
                  }
                />
              }
              label="Mezclar opciones de respuesta"
            />
            <Divider />
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                Cantidad predeterminada
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={settings.defaultQuestionCount}
                  onChange={(event) =>
                    updateSettings({
                      defaultQuestionCount:
                        event.target.value === "all"
                          ? "all"
                          : Number(event.target.value),
                    })
                  }
                >
                  {[10, 20, 30, 40, 50].map((count) => (
                    <MenuItem key={count} value={count}>
                      {count} preguntas
                    </MenuItem>
                  ))}
                  <MenuItem value="all">Examen completo</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                Umbral de aprobación (escala Microsoft)
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={settings.passingScore}
                  onChange={(event) =>
                    updateSettings({ passingScore: Number(event.target.value) })
                  }
                >
                  {[700, 720, 750, 800].map((score) => (
                    <MenuItem key={score} value={score}>
                      {score} / 1000
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} variant="contained">
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
