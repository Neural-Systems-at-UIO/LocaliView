import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState } from "react";

const API = import.meta.env.VITE_APP_API;

const UserAgreement = ({ open, onClose, onAccept, userEmail, userName }) => {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Usage Agreement for Access to HPC Resources via Rodent Workbench,
        WebIlastik and other dependent services.
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          Agreement between service provider University of Oslo and{" "}
          {userName || "the user"}.
        </Typography>

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          The user agrees:
        </Typography>

        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" gutterBottom>
            To use the service and the attached resources only for the purposes
            for which access has been granted.
          </Typography>
          <Typography component="li" gutterBottom>
            To use the system only for peaceful purposes and not to gain results
            for military purposes.
          </Typography>
          <Typography component="li" gutterBottom>
            Not to attempt to try to access resources of other users of the
            service, in case the interface would allow this.
          </Typography>
          <Typography component="li" gutterBottom>
            Not to enable any third person to access or use the service, nor to
            provide attendances with the service for them.
          </Typography>
          <Typography component="li" gutterBottom>
            To report any changes in contact information.
          </Typography>
          <Typography component="li" gutterBottom>
            The liability of the Jülich Supercomputing Centre (JSC) and the
            suppliers of the various resources for any damage suffered as a
            result of imperfections of the system shall be limited to intent and
            gross negligence except for damages arising from injury of life,
            body or health.
          </Typography>
          <Typography component="li" gutterBottom>
            That the account and credentials to access the service are personal
            and not transferable and therefore must be kept secure and
            confidential.
          </Typography>
          <Typography component="li" gutterBottom>
            That JSC reserves the right to suspend the service's access to the
            system if there are suspicions that the user breaches any of the
            obligations in this agreement.
          </Typography>
          <Typography component="li" gutterBottom>
            All papers and publications that are a result of resources used at
            JSC must contain the acknowledgements available at
            http://www.fz-juelich.de/ias/jsc/resource-acknowledgements.
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          The user further gives the following declarations:
        </Typography>

        <Typography>
          I am fully aware that scientific results gained through the use of
          supercomputers may be liable to European and US export control
          regulations.
        </Typography>

        <Typography>
          Therefore, I hereby guarantee that I will not use any resources made
          available to me in an abusive manner, in particular not for research
          with regards the following topics:
        </Typography>

        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" gutterBottom>
            ABC- (atomic, biological, chemical) weapons
          </Typography>
          <Typography component="li" gutterBottom>
            Missiles and unmanned aerial vehicles
          </Typography>
          <Typography component="li" gutterBottom>
            General reference to weapons, ammunition or armor goods
          </Typography>
          <Typography component="li" gutterBottom>
            Construction or operation of nuclear facilities
          </Typography>
          <Typography component="li" gutterBottom>
            Special goods for the surveillance of communication
          </Typography>
          <Typography component="li" gutterBottom>
            Goods which may be used for the execution of the death penalty,
            torture and any other cruel, inhumane or humiliating treatment
          </Typography>
        </Box>

        <Typography sx={{ mt: 2 }}>
          I will not export any knowledge or technology, which are subject to
          export-control, in any form (documents, personal communication,
          presentation, email, internet, cloud computing...).
        </Typography>

        <Typography>
          Details to applicable export control regulations are available at:
          <br />
          <a
            href="https://www.bafa.de/EN/Foreign_Trade/Export_Control/Export_Control_and_Academia/export_control_academia"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.bafa.de/EN/Foreign_Trade/Export_Control/Export_Control_and_Academia/export_control_academia
          </a>
        </Typography>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                color="primary"
              />
            }
            label={`I, ${userName || "the user"} (${
              userEmail || ""
            }), have read and agree to the terms above.`}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleAccept}
          variant="contained"
          color="primary"
          disabled={!agreed}
        >
          Accept Agreement
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserAgreement;
