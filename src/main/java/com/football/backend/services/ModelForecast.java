package com.football.backend.services;

import java.nio.FloatBuffer;
import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class ModelForecast {

    public static void get(float[] input) throws OrtException {
        try (OrtEnvironment env = OrtEnvironment.getEnvironment();
             OrtSession session = env.createSession("src/main/resources/lr_model/model.onnx", new OrtSession.SessionOptions())) {

            // Example input
            input = new float[]{1,0,0,0,1,0,0,0,0,1,0,1,21,10,10,1,0.5f,0,69,354,10,0,1,2,16,154,32,0.3333333432674408f,7,70,1,0,0,1,61.099998474121094f,67,1,5,1,0, 9.5F, 5.25F,1,3,4,36.25F,11,5,3,3,0.23076923191547394F,0.5F,52,209,10,0,0,1,8,84,24,1,7,35,0,0,1,0,81.30000305175781F,78,2,3,1,0,29,-2,0,0,7,37.85714340209961F
            };
            FloatBuffer inputBuffer = FloatBuffer.wrap(input);
            OnnxTensor tensor = OnnxTensor.createTensor(env, inputBuffer, new long[]{1, input.length});
            try (var result = session.run(Collections.singletonMap("float_input", tensor))){
                float[][] output = (float[][]) result.get(0).getValue();
                System.out.println("Class 0 prob: " + output[0][1]);
                System.out.println("Class 1 prob: " + output[0][0]);
            }

        }
    }
}
