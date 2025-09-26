import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Divider,
  Button,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Warning,
  Error,
  Info,
  Close,
  Schedule,
  Construction,
  Timeline,
  AttachMoney,
  LocationOn,
  Business,
  ReportProblem
} from '@mui/icons-material';
import { F } from '../dataConfig';
import { type Row } from '../utils/utils/metrics';

const NotificationCenter = ({ data, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const theme = useTheme();

  // Generar notificaciones basadas en datos reales
  useEffect(() => {
    if (!data || data.length === 0) return;

    const newNotifications = [];

    // 1. Obras con entregas retrasadas
    const obrasRetrasadas = data.filter(row => {
      const fechaEstimada = row[F.fechaEstimadaDeEntrega];
      const fechaReal = row[F.fechaRealDeEntrega];
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      // Si tiene fecha real y es mayor a la estimada
      if (fechaEstimada && fechaReal) {
        const fechaEst = new Date(fechaEstimada);
        const fechaRealDate = new Date(fechaReal);
        return fechaRealDate > fechaEst;
      }
      
      // Si no tiene fecha real pero la estimada ya pasó y no está entregada
      if (fechaEstimada && !fechaReal && !estadoObra.includes('entreg')) {
        const fechaEst = new Date(fechaEstimada);
        const hoy = new Date();
        return fechaEst < hoy;
      }
      
      return false;
    });

    obrasRetrasadas.forEach((obra, index) => {
      const fechaEstimada = new Date(obra[F.fechaEstimadaDeEntrega]);
      const hoy = new Date();
      const diasRetraso = Math.ceil((hoy - fechaEstimada) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        id: `retraso-${index}`,
        type: 'error',
        title: 'Obra Retrasada',
        message: `${String(obra[F.nombre] || 'Sin nombre').substring(0, 40)}...`,
        description: `Retraso de ${diasRetraso} días`,
        obra: obra,
        priority: 'high',
        timestamp: new Date(),
        read: false,
        action: 'Revisar cronograma'
      });
    });

    // 2. Obras que están por vencer (próximas 30 días)
    const obrasPorVencer = data.filter(row => {
      const fechaEstimada = row[F.fechaEstimadaDeEntrega];
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      if (!fechaEstimada || estadoObra.includes('entreg')) return false;
      
      const fechaEst = new Date(fechaEstimada);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaEst - hoy) / (1000 * 60 * 60 * 24));
      
      return diasRestantes <= 30 && diasRestantes > 0;
    });

    obrasPorVencer.forEach((obra, index) => {
      const fechaEstimada = new Date(obra[F.fechaEstimadaDeEntrega]);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaEstimada - hoy) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        id: `vencer-${index}`,
        type: 'warning',
        title: 'Obra por Vencer',
        message: `${String(obra[F.nombre] || 'Sin nombre').substring(0, 40)}...`,
        description: `${diasRestantes} días restantes`,
        obra: obra,
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        action: 'Acelerar proceso'
      });
    });

    // 3. Obras con presupuesto bajo ejecutado (< 30%)
    const obrasPresupuestoBajo = data.filter(row => {
      const presupuestoEjecutado = Number(row[F.presupuestoEjecutado]) || 0;
      const costoTotal = Number(row[F.costoTotalActualizado]) || 0;
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      if (costoTotal === 0 || estadoObra.includes('entreg')) return false;
      
      const porcentaje = (presupuestoEjecutado / costoTotal) * 100;
      return porcentaje < 30 && porcentaje > 0;
    });

    obrasPresupuestoBajo.forEach((obra, index) => {
      const presupuestoEjecutado = Number(obra[F.presupuestoEjecutado]) || 0;
      const costoTotal = Number(obra[F.costoTotalActualizado]) || 0;
      const porcentaje = (presupuestoEjecutado / costoTotal) * 100;
      
      newNotifications.push({
        id: `presupuesto-${index}`,
        type: 'info',
        title: 'Presupuesto Bajo',
        message: `${String(obra[F.nombre] || 'Sin nombre').substring(0, 40)}...`,
        description: `Solo ${porcentaje.toFixed(1)}% ejecutado`,
        obra: obra,
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        action: 'Revisar ejecución'
      });
    });

    // 4. Obras con riesgo identificado
    const obrasConRiesgo = data.filter(row => {
      const descripcionRiesgo = row[F.descripcionDelRiesgo];
      return descripcionRiesgo && String(descripcionRiesgo).trim().length > 0;
    });

    obrasConRiesgo.forEach((obra, index) => {
      newNotifications.push({
        id: `riesgo-${index}`,
        type: 'warning',
        title: 'Riesgo Identificado',
        message: `${String(obra[F.nombre] || 'Sin nombre').substring(0, 40)}...`,
        description: String(obra[F.descripcionDelRiesgo]).substring(0, 50) + '...',
        obra: obra,
        priority: 'high',
        timestamp: new Date(),
        read: false,
        action: 'Revisar plan de mitigación'
      });
    });

    // Ordenar por prioridad y timestamp
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.timestamp - a.timestamp;
    });

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.length);
  }, [data]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      default: return <CheckCircle color="success" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#4caf50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Box sx={{ maxWidth: 500, maxHeight: 600, overflow: 'hidden' }}>
      <Paper elevation={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={unreadCount} color="error">
                <ReportProblem 
                  sx={{ 
                    fontSize: 28, 
                    color: '#ff4444',
                    filter: 'drop-shadow(0 2px 4px rgba(255, 68, 68, 0.3))'
                  }} 
                />
              </Badge>
              <Typography variant="h6" fontWeight="bold">
                Centro de Alertas
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Marcar todas
              </Button>
              <IconButton size="small" onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Lista de notificaciones */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                ¡Excelente! No hay alertas
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Todas las obras están en buen estado
              </Typography>
            </Box>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <ListItem
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : alpha(getNotificationColor(notification.type), 0.1),
                      borderLeft: `4px solid ${notification.read ? 'transparent' : getNotificationColor(notification.type)}`,
                      '&:hover': {
                        backgroundColor: alpha(getNotificationColor(notification.type), 0.05),
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          backgroundColor: alpha(getNotificationColor(notification.type), 0.2),
                          color: getNotificationColor(notification.type),
                          width: 32,
                          height: 32
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            variant="outlined"
                          />
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: getNotificationColor(notification.type)
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" fontWeight="bold">
                            {notification.message}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {notification.description}
                          </Typography>
                          <Typography variant="caption" color="primary">
                            💡 {notification.action}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {formatTimeAgo(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    
                  </ListItem>
                  <Divider />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
            {unreadCount} notificaciones no leídas
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationCenter;
