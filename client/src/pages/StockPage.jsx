import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, Snackbar,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SettingsIcon from '@mui/icons-material/Settings';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY_ADD = { itemName: '', quantity: '', unit: '', lowThreshold: '' };
const EMPTY_SETTINGS = { itemName: '', lowThreshold: '' };

export default function StockPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const canEdit = isAdmin || user?.role === 'chef';

  const [view, setView] = useState('active');
  const [stock, setStock] = useState([]);
  const [archivedStock, setArchivedStock] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingQty, setEditingQty] = useState('');
  const [savingId, setSavingId] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState(null);
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(view === 'archived' ? '/stock?archived=true' : '/stock');
      if (view === 'archived') {
        setArchivedStock(res.data.stock ?? []);
      } else {
        setStock(res.data.stock ?? []);
      }
    } catch {
      notify(t('stock.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t, view]);

  useEffect(() => { loadStock(); }, [loadStock]);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditingQty(String(item.quantity));
  };

  const cancelEdit = () => { setEditingId(null); setEditingQty(''); };

  const saveQty = async (id) => {
    const qty = parseFloat(editingQty);
    if (isNaN(qty) || qty < 0) { cancelEdit(); return; }
    setEditingId(null);
    setSavingId(id);
    try {
      const res = await api.patch(`/stock/${id}`, { quantity: qty });
      setStock(prev => prev.map(s => s._id === id ? res.data.stockItem : s));
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToUpdateQty'), 'error');
      loadStock();
    } finally {
      setSavingId(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      const res = await api.post('/stock', {
        itemName: addForm.itemName,
        quantity: Number(addForm.quantity),
        unit: addForm.unit,
        lowThreshold: Number(addForm.lowThreshold),
      });
      setStock(prev => [...prev, res.data.stockItem]);
      setAddForm(EMPTY_ADD);
      setAddOpen(false);
      notify(t('stock.itemAdded'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToAdd'), 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  const openSettings = (item) => {
    setSettingsTarget(item);
    setSettingsForm({ itemName: item.itemName, lowThreshold: String(item.lowThreshold) });
    setSettingsOpen(true);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsSubmitting(true);
    try {
      const res = await api.patch(`/stock/${settingsTarget._id}/settings`, {
        itemName: settingsForm.itemName,
        lowThreshold: Number(settingsForm.lowThreshold),
      });
      setStock(prev => prev.map(s => s._id === settingsTarget._id ? res.data.stockItem : s));
      setSettingsOpen(false);
      notify(t('stock.settingsUpdated'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToUpdateSettings'), 'error');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.delete(`/stock/${id}`);
      setStock(prev => prev.filter(s => s._id !== id));
      notify(t('stock.itemArchived'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToArchive'), 'error');
    }
  };

  const handlePermanentDelete = async (id, itemName) => {
    if (!window.confirm(`Permanently delete ${itemName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/stock/${id}/permanent`);
      setStock(prev => prev.filter(s => s._id !== id));
      notify('Stock item permanently deleted');
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToArchive'), 'error');
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await api.patch(`/stock/${id}/unarchive`);
      setArchivedStock(prev => prev.filter(s => s._id !== id));
      notify('Item unarchived — it will appear in Active stock');
    } catch (err) {
      notify(err.response?.data?.message ?? t('stock.failedToArchive'), 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('stock.title')}</Typography>
        {isAdmin && view === 'active' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {t('stock.addItem')}
          </Button>
        )}
      </Stack>

      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, val) => { if (val) setView(val); }}
        color="success"
        size="small"
        sx={{ mb: 2.5 }}
      >
        <ToggleButton value="active">Active</ToggleButton>
        <ToggleButton value="archived">Archived</ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>
      ) : view === 'active' ? (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell align="right">{t('common.quantity')}</TableCell>
              <TableCell>{t('common.unit')}</TableCell>
              <TableCell align="right">{t('stock.threshold')}</TableCell>
              <TableCell align="center">{t('common.status')}</TableCell>
              {isAdmin && <TableCell align="center">{t('common.actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {t('stock.noItems')}
                </TableCell>
              </TableRow>
            ) : stock.map(item => (
              <TableRow
                key={item._id}
                hover
                sx={item.isLow ? { bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } } : {}}
              >
                <TableCell>{item.itemName}</TableCell>

                <TableCell align="right" sx={{ minWidth: 100 }}>
                  {savingId === item._id ? (
                    <CircularProgress size={16} />
                  ) : canEdit && editingId === item._id ? (
                    <TextField
                      value={editingQty}
                      onChange={e => setEditingQty(e.target.value)}
                      onBlur={() => saveQty(item._id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveQty(item._id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      type="number"
                      size="small"
                      slotProps={{ htmlInput: { min: 0, step: 'any', style: { textAlign: 'right' } } }}
                      sx={{ width: 90 }}
                    />
                  ) : (
                    <Box
                      onClick={() => canEdit && startEdit(item)}
                      sx={{
                        display: 'inline-block',
                        px: 1, py: 0.25, borderRadius: 1,
                        cursor: canEdit ? 'pointer' : 'default',
                        '&:hover': canEdit ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      {item.quantity}
                    </Box>
                  )}
                </TableCell>

                <TableCell>{item.unit}</TableCell>
                <TableCell align="right">{item.lowThreshold}</TableCell>

                <TableCell align="center">
                  {item.isLow
                    ? <Chip label={t('stock.lowStock')} color="error" size="small" />
                    : <Chip label={t('stock.ok')} color="success" size="small" />}
                </TableCell>

                {isAdmin && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" onClick={() => openSettings(item)}>
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="warning" onClick={() => handleArchive(item._id)}>
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handlePermanentDelete(item._id, item.itemName)}>
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell align="right">{t('common.quantity')}</TableCell>
              <TableCell>{t('common.unit')}</TableCell>
              <TableCell align="right">{t('stock.threshold')}</TableCell>
              {isAdmin && <TableCell align="center">{t('common.actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {archivedStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No archived items
                </TableCell>
              </TableRow>
            ) : archivedStock.map(item => (
              <TableRow key={item._id} hover>
                <TableCell>{item.itemName}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell align="right">{item.lowThreshold}</TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UnarchiveIcon fontSize="small" />}
                      onClick={() => handleUnarchive(item._id)}
                    >
                      Unarchive
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add item dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('stock.addStockItem')}</DialogTitle>
        <Box component="form" onSubmit={handleAddSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label={t('stock.itemName')} value={addForm.itemName} required autoFocus
                onChange={e => setAddForm(f => ({ ...f, itemName: e.target.value }))}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('common.quantity')} value={addForm.quantity} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label={t('common.unit')} value={addForm.unit} required
                  onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <TextField
                label={t('stock.lowStockThreshold')} value={addForm.lowThreshold} type="number" required
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setAddForm(f => ({ ...f, lowThreshold: e.target.value }))}
                fullWidth
                helperText={t('stock.thresholdHelper')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={addSubmitting}>
              {addSubmitting ? <CircularProgress size={20} color="inherit" /> : t('common.add')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit settings dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('stock.editSettings', { itemName: settingsTarget?.itemName })}</DialogTitle>
        <Box component="form" onSubmit={handleSettingsSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label={t('stock.itemName')} value={settingsForm.itemName} required
                onChange={e => setSettingsForm(f => ({ ...f, itemName: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('stock.lowStockThreshold')} value={settingsForm.lowThreshold} type="number" required
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setSettingsForm(f => ({ ...f, lowThreshold: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={settingsSubmitting}>
              {settingsSubmitting ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
