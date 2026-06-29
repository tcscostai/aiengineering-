       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMADJ.
      ******************************************************************
      * CLMADJ — Claim adjudication rules engine (legacy)               *
      ******************************************************************
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY CLAIM-REC.
           COPY MEMBER-REC.
           01  WS-RULE-TABLE          PIC X(20) VALUE 'ADJ-RULES-V12'.
       LINKAGE SECTION.
           01  LK-CLAIM               PIC X(200).
       PROCEDURE DIVISION USING LK-CLAIM.
           MOVE LK-CLAIM TO CLAIM-RECORD.
           IF CLM-BILLED-AMT > 50000
               MOVE ZERO TO CLM-PAID-AMT
               SET CLM-DENIED TO TRUE
           ELSE
               COMPUTE CLM-ALLOWED-AMT = CLM-BILLED-AMT * 0.80
               MOVE CLM-ALLOWED-AMT TO CLM-PAID-AMT
               SET CLM-ADJUDICATED TO TRUE
           END-IF.
           MOVE CLAIM-RECORD TO LK-CLAIM.
           GOBACK.
