import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Form,
  FormGroup,
  RadioButton,
  RadioButtonGroup,
  ContentSwitcher,
  Switch,
  Select,
  SelectItem,
} from '@carbon/react';
import {
  ConfigObject,
  showNotification,
  showToast,
  toDateObjectStrict,
  toOmrsIsoString,
  useConfig,
  useLocations,
  useSession,
} from '@openmrs/esm-framework';
import { updateQueueEntry, usePriority, useServices, useStatus } from './active-visits-table.resource';
import { useTranslation } from 'react-i18next';
import styles from './change-status-dialog.scss';
import { useSWRConfig } from 'swr';
import first from 'lodash-es/first';
import { MappedQueueEntry } from '../types';

interface ChangeStatusDialogProps {
  queueEntry: MappedQueueEntry;
  closeModal: () => void;
}

const ChangeStatus: React.FC<ChangeStatusDialogProps> = ({ queueEntry, closeModal }) => {
  const { t } = useTranslation();

  const [status, setStatus] = useState(queueEntry.statusUuid);
  const [priority, setPriority] = useState(queueEntry.priorityUuid);
  const [visitUuid, setVisitUuid] = useState(queueEntry.visitUuid);
  const [previousQueueUuid, setPreviousQueueUuid] = useState(queueEntry.queueUuid);
  const [newQueueUuid, setNewQueueUuid] = useState('');
  const [queueEntryUuid, setQueueEntryUuid] = useState(queueEntry.queueEntryUuid);
  const [patientUuid, setPatientUuid] = useState(queueEntry.patientUuid);
  const [patientName, setPatientName] = useState(queueEntry.name);
  const [patientAge, setPatientAge] = useState(queueEntry.patientAge);
  const [patientSex, setPatientSex] = useState(queueEntry.patientSex);
  const { priorities } = usePriority();
  const { statuses, isLoading } = useStatus();
  const { mutate } = useSWRConfig();
  const [userLocation, setUserLocation] = useState('');
  const session = useSession();
  const locations = useLocations();
  const { services } = useServices(userLocation);
  const config = useConfig() as ConfigObject;

  useEffect(() => {
    setNewQueueUuid(previousQueueUuid);
  }, [previousQueueUuid]);

  useEffect(() => {
    if (!userLocation && session?.sessionLocation !== null) {
      setUserLocation(session?.sessionLocation?.uuid);
    } else if (!userLocation && locations) {
      setUserLocation(first(locations)?.uuid);
    }
  }, [session, locations, userLocation]);

  const changeQueueStatus = useCallback(() => {
    const defaultStatus = config.concepts.defaultStatusConceptUuid;
    const defaultPriority = config.concepts.defaultPriorityConceptUuid;
    if (priority === '') {
      setPriority(defaultPriority);
    }
    if (status === '') {
      setStatus(defaultStatus);
    }
    const endDate = toDateObjectStrict(toOmrsIsoString(new Date()));
    updateQueueEntry(
      visitUuid,
      previousQueueUuid,
      newQueueUuid,
      queueEntryUuid,
      patientUuid,
      priority,
      status,
      endDate,
      new AbortController(),
    ).then(
      ({ status }) => {
        if (status === 201) {
          showToast({
            critical: true,
            title: t('updateEntry', 'Update entry'),
            kind: 'success',
            description: t('queueEntryUpdateSuccessfully', 'Queue Entry Updated Successfully'),
          });
          closeModal();
          mutate(`/ws/rest/v1/visit-queue-entry?v=full`);
        }
      },
      (error) => {
        showNotification({
          title: t('queueEntryUpdateFailed', 'Error updating queue entry status'),
          kind: 'error',
          critical: true,
          description: error?.message,
        });
      },
    );
  }, [
    priority,
    status,
    visitUuid,
    previousQueueUuid,
    newQueueUuid,
    queueEntryUuid,
    patientUuid,
    priorities,
    statuses,
    t,
    closeModal,
    mutate,
  ]);

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={t('changePatientQueueStatus', 'Change patient queue status?')} />
      <ModalBody>
        <Form onSubmit={changeQueueStatus}>
          <div className={styles.modalBody}>
            <h5>
              {patientName} &nbsp; · &nbsp;{patientSex} &nbsp; · &nbsp;{patientAge}&nbsp;{t('years', 'Years')}
            </h5>
          </div>
          <div className={styles.sectionTitle}>{t('queueStatus', 'Queue status')}</div>
          <FormGroup legendText="">
            <RadioButtonGroup
              className={styles.radioButtonGroup}
              valueSelected={status}
              orientation="vertical"
              onChange={(event) => setStatus(event.toString())}
              name="radio-button-group">
              {isLoading ? (
                <InlineLoading role="progressbar" description={t('loading', 'Loading...')} />
              ) : statuses?.length === 0 ? (
                <p>{t('noStatusAvailable', 'No Status Available')}</p>
              ) : (
                statuses.map(({ uuid, display, name }) => (
                  <RadioButton key={uuid} className={styles.radioButton} id={name} labelText={display} value={uuid} />
                ))
              )}
            </RadioButtonGroup>
          </FormGroup>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('queueService', 'Queue service')}</div>
            <Select
              labelText={t('selectService', 'Select a service')}
              id="service"
              invalidText="Required"
              value={newQueueUuid}
              onChange={(event) => setNewQueueUuid(event.target.value)}>
              {!newQueueUuid ? <SelectItem text={t('chooseService', 'Select a service')} value="" /> : null}
              {services?.length > 0 &&
                services.map((service) => (
                  <SelectItem key={service.uuid} text={service.display} value={service.uuid}>
                    {service.display}
                  </SelectItem>
                ))}
            </Select>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('queuePriority', 'Queue priority')}</div>
            <ContentSwitcher
              size="sm"
              selectedIndex={1}
              onChange={(event) => {
                setPriority(event.name as any);
              }}>
              {priorities?.length > 0 ? (
                priorities.map(({ uuid, display }) => {
                  return <Switch name={uuid} text={display} key={uuid} value={uuid} />;
                })
              ) : (
                <Switch
                  name={t('noPriorityFound', 'No priority found')}
                  text={t('noPriorityFound', 'No priority found')}
                  value={null}
                />
              )}
            </ContentSwitcher>
          </section>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button onClick={changeQueueStatus}>{t('exitAndChangeStatus', 'Exit and change status')}</Button>
      </ModalFooter>
    </div>
  );
};

export default ChangeStatus;
