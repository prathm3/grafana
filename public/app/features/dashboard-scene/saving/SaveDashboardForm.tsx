import React, { useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button, Checkbox, TextArea, Stack, Alert, Box, Field } from '@grafana/ui';
import { SaveDashboardOptions } from 'app/features/dashboard/components/SaveDashboard/types';

import { DashboardScene } from '../scene/DashboardScene';

import { SaveDashboardDrawer } from './SaveDashboardDrawer';
import {
  DashboardChangeInfo,
  NameAlreadyExistsError,
  SaveButton,
  isNameExistsError,
  isPluginDashboardError,
  isVersionMismatchError,
} from './shared';
import { useDashboardSave } from './useSaveDashboard';

export interface Props {
  dashboard: DashboardScene;
  drawer: SaveDashboardDrawer;
  changeInfo: DashboardChangeInfo;
}

export function SaveDashboardForm({ dashboard, drawer, changeInfo }: Props) {
  const { saveVariables = false, saveTimeRange = false } = drawer.useState();
  const { changedSaveModel, hasChanges, hasTimeChanged, hasVariableValuesChanged } = changeInfo;

  const { state, onSaveDashboard } = useDashboardSave(false);
  const [options, setOptions] = useState<SaveDashboardOptions>({
    folderUid: dashboard.state.meta.folderUid,
  });

  const onSave = async (overwrite: boolean) => {
    const result = await onSaveDashboard(dashboard, changedSaveModel, { ...options, overwrite });
    if (result.status === 'success') {
      dashboard.closeModal();
    }
  };

  const cancelButton = (
    <Button variant="secondary" onClick={() => dashboard.closeModal()} fill="outline">
      Cancel
    </Button>
  );

  const saveButton = (overwrite: boolean) => (
    <SaveButton isValid={hasChanges} isLoading={state.loading} onSave={onSave} overwrite={overwrite} />
  );

  function renderFooter(error?: Error) {
    if (isVersionMismatchError(error)) {
      return (
        <Alert title="Someone else has updated this dashboard" severity="error">
          <p>Would you still like to save this dashboard?</p>
          <Box paddingTop={2}>
            <Stack alignItems="center">
              {cancelButton}
              {saveButton(true)}
            </Stack>
          </Box>
        </Alert>
      );
    }

    if (isNameExistsError(error)) {
      return <NameAlreadyExistsError cancelButton={cancelButton} saveButton={saveButton} />;
    }

    if (isPluginDashboardError(error)) {
      return (
        <Alert title="Plugin dashboard" severity="error">
          <p>
            Your changes will be lost when you update the plugin. Use <strong>Save As</strong> to create custom version.
          </p>
          <Box paddingTop={2}>
            <Stack alignItems="center">
              {cancelButton}
              {saveButton(true)}
            </Stack>
          </Box>
        </Alert>
      );
    }

    return (
      <>
        {error && (
          <Alert title="Failed to save dashboard" severity="error">
            <p>{error.message}</p>
          </Alert>
        )}
        <Stack alignItems="center">
          {cancelButton}
          {saveButton(false)}
          {!hasChanges && <div>No changes to save</div>}
        </Stack>
      </>
    );
  }

  return (
    <Stack gap={0} direction="column">
      {hasTimeChanged && (
        <Field label="Save current time range" description="Will make current time range the new default">
          <Checkbox
            id="save-timerange"
            checked={saveTimeRange}
            onChange={drawer.onToggleSaveTimeRange}
            aria-label={selectors.pages.SaveDashboardModal.saveTimerange}
          />
        </Field>
      )}
      {hasVariableValuesChanged && (
        <Field label="Save current variable values" description="Will make the current values the new default">
          <Checkbox
            checked={saveVariables}
            onChange={drawer.onToggleSaveVariables}
            label="Save current variable values as dashboard default"
            aria-label={selectors.pages.SaveDashboardModal.saveVariables}
          />
        </Field>
      )}
      <Field label="Message">
        {/* config.featureToggles.dashgpt * TOOD GenAIDashboardChangesButton */}

        <TextArea
          aria-label="message"
          value={options.message ?? ''}
          onChange={(e) => {
            setOptions({
              ...options,
              message: e.currentTarget.value,
            });
          }}
          placeholder="Add a note to describe your changes (optional)."
          autoFocus
          rows={5}
        />
      </Field>
      <Box paddingTop={2}>{renderFooter(state.error)}</Box>
    </Stack>
  );
}