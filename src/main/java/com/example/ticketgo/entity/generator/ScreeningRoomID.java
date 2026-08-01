package com.example.ticketgo.entity.generator;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class ScreeningRoomID implements IdentifierGenerator {

    private static final String PREFIX = "PC-";
    private static final int NUMBER_LENGTH = 3;

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) {
        Connection connection = null;
        try {
            connection = session.getJdbcConnectionAccess().obtainConnection();
            Statement statement = connection.createStatement();

            // 1. Sửa lại đúng tên bảng là screening_room
            ResultSet rs = statement.executeQuery("SELECT MAX(id) FROM screening_room");

            if (rs.next()) {
                String maxId = rs.getString(1);
                if (maxId != null && maxId.startsWith(PREFIX)) {
                    // Tách phần số đằng sau PC-
                    String numberStr = maxId.substring(PREFIX.length());
                    int nextNumber = Integer.parseInt(numberStr) + 1;

                    return PREFIX + String.format("%0" + NUMBER_LENGTH + "d", nextNumber);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (connection != null) {
                try {
                    session.getJdbcConnectionAccess().releaseConnection(connection);
                } catch (Exception ignored) {}
            }
        }

        // Mặc định ban đầu nếu chưa có dữ liệu: PC-001
        return PREFIX + String.format("%0" + NUMBER_LENGTH + "d", 1);
    }
}