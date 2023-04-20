import React, {useEffect} from "react";
import {Button, Col, Form, Modal, ModalProps, Row, Spinner} from "react-bootstrap";
import {SubmitHandler, useForm} from "react-hook-form";
import {toast} from "react-hot-toast";

import {ADDR_KODO_PROTOCOL} from "@renderer/const/kodo-nav";

import {useI18n} from "@renderer/modules/i18n";
import {EndpointType, useAuth} from "@renderer/modules/auth";
import * as AuditLog from "@renderer/modules/audit-log";
import {useKodoExternalPath} from "@renderer/modules/kodo-address";
import {listFiles} from "@renderer/modules/qiniu-client";
import useLoadRegions from "@renderer/modules/qiniu-client-hooks/use-load-regions";

interface AddExternalPathFormDate {
  path: string,
  regionId: string,
}

interface AddExternalPathProps {
  onAddedExternalPath: () => void,
}

const AddExternalPath: React.FC<ModalProps & AddExternalPathProps> = ({
  onAddedExternalPath,
  ...modalProps
}) => {
  const {currentLanguage, translate} = useI18n();
  const {currentUser} = useAuth();

  // load regions
  const {
    loadRegionsState,
  } = useLoadRegions({
    user: currentUser,
  });
  useEffect(() => {
    if (!loadRegionsState.regions.length) {
      return;
    }
    reset({
      regionId: loadRegionsState.regions[0].s3Id,
    });
  }, [loadRegionsState.regions]);

  // reset form when modal show change
  useEffect(() => {
    reset();
  }, [modalProps.show]);

  // external path
  const {
    externalPathState: {
      kodoExternalPath,
    },
    setExternalPaths,
  } = useKodoExternalPath(currentUser);

  // add external path form
  const {
    handleSubmit,
    register,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AddExternalPathFormDate>();

  const handleAddExternalPath: SubmitHandler<AddExternalPathFormDate> = (data) => {
    if (!currentUser || !kodoExternalPath) {
      return;
    }

    const externalPaths = kodoExternalPath.read().list;
    if (externalPaths.some(externalPath =>
      externalPath.regionId === data.regionId &&
      externalPath.path === data.path
    )) {
      toast.error(translate("modals.addExternalPath.error.duplicated"));
      return;
    }

    const [bucketId] = data.path.split("/", 1);
    const prefix = data.path.slice(`${bucketId}/`.length);

    const opt = {
      id: currentUser.accessKey,
      secret: currentUser.accessSecret,
      isPublicCloud: currentUser.endpointType === EndpointType.Public,
      preferS3Adapter: true,
      maxKeys: 1,
      minKeys: 0,
      storageClasses: [],
    };
    const p = listFiles(
      data.regionId,
      bucketId,
      prefix,
      undefined,
      opt,
    );

    p.then(() => {
      kodoExternalPath?.addExternalPath({
        regionId: data.regionId,
        protocol: ADDR_KODO_PROTOCOL,
        path: data.path,
      });
      setExternalPaths(kodoExternalPath?.read().list ?? []);
      reset();
      AuditLog.log(AuditLog.Action.AddExternalPath, {
        regionId: data.regionId,
        path: ADDR_KODO_PROTOCOL + data.path,
      });
      modalProps.onHide?.();
      onAddedExternalPath();
    });

    return toast.promise(p, {
      loading: translate("common.submitting"),
      success: translate("common.submitted"),
      error: err => `${translate("common.failed")}: ${err}`,
    });
  };
  return (
    <Modal {...modalProps}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-signpost-2-fill text-brown me-1"/>
          {translate("modals.addExternalPath.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <fieldset disabled={isSubmitting || loadRegionsState.loading}>
            <Form.Group
              as={Row}
              className="mb-3"
              controlId="regionId"
            >
              <Form.Label className="text-end" column sm={3}>
                {translate("modals.addExternalPath.form.region.label")}
              </Form.Label>
              <Col sm={9}>
                {
                  loadRegionsState.regions.length > 0
                    ? (
                      <>
                        <Form.Select
                          {...register("regionId", {
                            required: translate("modals.addExternalPath.form.region.feedback.required"),
                          })}
                          size="sm"
                          isInvalid={Boolean(errors.regionId)}
                        >
                          {loadRegionsState.regions.map(r => (
                            <option key={r.s3Id} value={r.s3Id}>
                              {/* may empty string, so use `||` instead of `??` */}
                              {r.translatedLabels?.[currentLanguage] || r.label || r.s3Id}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.regionId?.message}
                        </Form.Control.Feedback>
                      </>
                    )
                    : (
                      <Spinner className="me-2" animation="border" size="sm"/>
                    )
                }
              </Col>
            </Form.Group>
            <Form.Group
              as={Row}
              className="mb-3"
              controlId="path"
            >
              <Form.Label className="text-end" column sm={3}>
                {translate("modals.addExternalPath.form.path.label")}
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  {...register("path", {
                    required: translate("modals.addExternalPath.form.path.feedback.required"),
                  })}
                  size="sm"
                  type="text"
                  placeholder={translate("modals.addExternalPath.form.path.holder")}
                  isInvalid={Boolean(errors.path)}
                />
                <Form.Text>
                  {translate("modals.addExternalPath.form.path.hint")}
                </Form.Text>
              </Col>
            </Form.Group>
          </fieldset>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          size="sm"
          disabled={isSubmitting}
          onClick={handleSubmit(handleAddExternalPath)}
        >
          {isSubmitting ? translate("common.submitting") : translate("modals.addExternalPath.submit")}
        </Button>
        <Button
          variant="light"
          size="sm"
          onClick={modalProps.onHide}
        >
          {translate("common.close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddExternalPath;
