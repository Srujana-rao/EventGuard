import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';

export default function IncidentRecommendations({ incident }) {
  if (!incident) return null;

  const { severity, actions } = incident;

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6">AI Recommendations</Typography>
        <Typography variant="subtitle2" sx={{ mt: 1 }}>
          Severity:{' '}
          {severity ? (
            <Chip label={severity} color={severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'default'} size="small" />
          ) : (
            <Typography component="span" variant="body2">Not available</Typography>
          )}
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 1 }}>Immediate Actions</Typography>
        {actions && actions.length > 0 ? (
          <List dense>
            {actions.map((a, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={`${idx + 1}. ${a}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2">No AI recommendations available.</Typography>
        )}
      </CardContent>
    </Card>
  );
}
