       IDENTIFICATION DIVISION.
       PROGRAM-ID. MEMSRV.
      ******************************************************************
      * MEMSRV — Member inquiry service (CICS-style)                    *
      ******************************************************************
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY MEMBER-REC.
           COPY ELIG-REC.
       PROCEDURE DIVISION.
           DISPLAY 'MEMSRV ONLINE'.
           CALL 'ELIGCHK' USING MEMBER-RECORD ELIG-RECORD.
           STOP RUN.
