-- phpMyAdmin SQL Dump
-- version 4.7.1
-- https://www.phpmyadmin.net/
--
-- Host: sql10.freesqldatabase.com
-- Tempo de geração: 13/08/2025 às 12:08
-- Versão do servidor: 5.5.62-0ubuntu0.14.04.1
-- Versão do PHP: 7.0.33-0ubuntu0.16.04.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `sql10792206`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendamentos`
--

CREATE TABLE `agendamentos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `horario` varchar(50) NOT NULL,
  `dia` date NOT NULL,
  `dia_todo` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Fazendo dump de dados para tabela `agendamentos`
--

INSERT INTO `agendamentos` (`id`, `nome`, `horario`, `dia`, `dia_todo`) VALUES
(18, 'Miliane', 'Dia inteiro', '2025-07-21', 1),
(20, 'Marina', 'Dia inteiro', '2025-07-26', 1),
(21, 'Karla', 'Dia inteiro', '2025-07-27', 1),
(22, 'Keliane', 'Dia inteiro', '2025-07-28', 1),
(23, 'Afonso', '15:00 - 17:00', '2025-07-29', 0),
(24, 'Lucilene', 'Dia inteiro', '2025-08-02', 1),
(25, 'Amanda', 'Dia inteiro', '2025-08-03', 1),
(26, 'Miliane', 'Dia inteiro', '2025-08-04', 1),
(27, 'Elenn', 'Dia inteiro', '2025-08-09', 1),
(28, 'Elessandra', 'Dia inteiro', '2025-08-10', 1),
(29, '???', 'Dia inteiro', '2025-08-15', 1),
(30, 'Aline', 'Dia inteiro', '2025-08-16', 1),
(31, 'Clara', 'Dia inteiro', '2025-08-17', 1),
(32, 'Stefany', 'Dia inteiro', '2025-08-23', 1),
(33, 'Adriele', 'Dia inteiro', '2025-08-24', 1),
(34, 'Patricia', 'Dia inteiro', '2025-08-29', 1),
(35, 'Elenn', 'Dia inteiro', '2025-08-30', 1),
(36, 'Ysnara', 'Dia inteiro', '2025-08-31', 1),
(37, 'Lucilene', 'Dia inteiro', '2025-09-06', 1),
(38, 'Elenn', 'Dia inteiro', '2025-09-07', 1),
(39, 'Su', 'Dia inteiro', '2025-09-08', 1),
(40, 'Railson', 'Dia inteiro', '2025-09-13', 1),
(41, 'Marcos', 'Dia inteiro', '2025-09-14', 1),
(42, 'Marcelo', 'Dia inteiro', '2025-09-20', 1),
(43, 'Patricia', 'Dia inteiro', '2025-09-21', 1),
(44, 'Carlinhos', 'Dia inteiro', '2025-09-23', 1),
(45, 'Clara', 'Dia inteiro', '2025-09-28', 1),
(46, 'Paulo Marley', 'Dia inteiro', '2025-10-04', 1),
(47, 'Mateus', 'Dia inteiro', '2025-10-05', 1),
(48, 'Railson', 'Dia inteiro', '2025-10-12', 1),
(49, 'Julimara', 'Dia inteiro', '2025-10-26', 1),
(50, 'Clara', 'Dia inteiro', '2025-10-27', 1),
(51, 'Yasmin', 'Dia inteiro', '2025-11-02', 1),
(52, 'Stefany', 'Dia inteiro', '2025-11-09', 1),
(53, 'Patricia', 'Dia inteiro', '2025-11-15', 1),
(54, 'Clara', 'Dia inteiro', '2025-12-07', 1),
(55, 'Mateus', 'Dia inteiro', '2025-12-24', 1),
(56, 'Paulo Marley', 'Dia inteiro', '2025-12-25', 1),
(57, 'Miliane', 'Dia inteiro', '2025-12-31', 1),
(106, 'Davi', 'Dia inteiro', '2025-12-27', 1),
(107, 'Vitória B', 'Dia inteiro', '2025-09-04', 1),
(108, 'Aline', 'Dia inteiro', '2025-09-27', 1),
(109, 'Aline', 'Dia inteiro', '2025-10-11', 1),
(110, 'Aline', 'Dia inteiro', '2025-11-16', 1),
(111, 'Davi', '08:00 - 16:00', '2025-11-29', 0),
(112, 'Aline', 'Dia inteiro', '2025-12-13', 1),
(114, 'Miliane', '13:00 - 17:00', '2025-08-22', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_dias`
--

CREATE TABLE `status_dias` (
  `id` int(11) NOT NULL,
  `dia` date NOT NULL,
  `status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Fazendo dump de dados para tabela `status_dias`
--

INSERT INTO `status_dias` (`id`, `dia`, `status`) VALUES
(7, '2025-08-01', 'manutencao');

--
-- Índices de tabelas apagadas
--

--
-- Índices de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `status_dias`
--
ALTER TABLE `status_dias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dia` (`dia`);

--
-- AUTO_INCREMENT de tabelas apagadas
--

--
-- AUTO_INCREMENT de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;
--
-- AUTO_INCREMENT de tabela `status_dias`
--
ALTER TABLE `status_dias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
